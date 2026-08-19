<?php
namespace Tests\Feature;

use App\Support\DocrootBuild;
use Tests\TestCase;

/**
 * The web-root build sync (see App\Support\DocrootBuild).
 *
 * The property that matters most is the negative one: this thing copies
 * directories around on a live server, and it must do absolutely nothing
 * anywhere that is not the Hostinger split layout. On a developer machine
 * `dirname(base_path())` is the XAMPP htdocs root — every other site on the
 * box. Getting the guard wrong would write into all of them.
 */
class DocrootBuildTest extends TestCase
{
    private array $tempDirs = [];

    protected function setUp(): void
    {
        parent::setUp();
        $this->forgetWebRoot();
    }

    protected function tearDown(): void
    {
        foreach ($this->tempDirs as $dir) $this->rrmdir($dir);
        $this->forgetWebRoot();
        parent::tearDown();
    }

    /**
     * webRoot() memoises, because the shell request now asks it more than once.
     * A static that survives between tests would let the first test's answer
     * decide the rest, so each test starts from an unresolved detector.
     */
    private function forgetWebRoot(): void
    {
        foreach (['webRoot' => null, 'webRootResolved' => false] as $prop => $value) {
            $ref = new \ReflectionProperty(DocrootBuild::class, $prop);
            $ref->setAccessible(true);
            $ref->setValue(null, $value);
        }
    }

    /** @return mixed */
    private function callPrivate(string $method, ...$args)
    {
        $ref = new \ReflectionMethod(DocrootBuild::class, $method);
        $ref->setAccessible(true);
        return $ref->invoke(null, ...$args);
    }

    private function tempDir(): string
    {
        $dir = sys_get_temp_dir() . '/it-docroot-' . bin2hex(random_bytes(6));
        mkdir($dir, 0777, true);
        $this->tempDirs[] = $dir;
        return $dir;
    }

    private function rrmdir(string $dir): void
    {
        if (!is_dir($dir)) return;
        $it = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($dir, \FilesystemIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::CHILD_FIRST,
        );
        foreach ($it as $f) $f->isDir() ? @rmdir($f->getPathname()) : @unlink($f->getPathname());
        @rmdir($dir);
    }

    /** THE safety test: no patched index.php one level up means no docroot, means no copying. */
    public function test_it_refuses_to_act_outside_the_hostinger_split_layout(): void
    {
        // webRoot(), and public now: WebRootVite resolves the Vite manifest
        // against the same directory, and one detector must give one answer.
        $this->assertNull(DocrootBuild::webRoot(),
            'Local layout must not be mistaken for the server web root.');

        $sibling = dirname(base_path());
        $before  = is_dir($sibling) ? scandir($sibling) : [];

        DocrootBuild::ensure();

        $this->assertSame($before, is_dir($sibling) ? scandir($sibling) : [],
            'ensure() wrote into the parent directory on a non-Hostinger layout.');
    }

    /**
     * The detection marker must match what the server's own installer produces.
     *
     * If it does not, `docroot()` returns null on the live server, `ensure()`
     * quietly does nothing, and the blank page comes back with no error
     * anywhere to explain why. So reproduce the installer's transformation from
     * the real files and assert the marker survives it.
     */
    public function test_the_marker_matches_what_the_hostinger_installer_writes(): void
    {
        $index = file_get_contents(public_path('index.php'));
        $setup = file_get_contents(base_path('deploy/hostinger-setup.sh'));

        // The installer copies public/index.php up a level and rewrites the
        // relative requires:  sed "s#__DIR__\.'/\.\./#__DIR__.'/laravel/#g"
        $this->assertStringContainsString("s#__DIR__\\.'/\\.\\./#__DIR__.'/laravel/#g", $setup,
            'The installer no longer rewrites index.php the way this marker assumes.');

        $patched = str_replace("__DIR__.'/../", "__DIR__.'/laravel/", $index);

        // …and 'laravel' is the app directory name, which is what docroot() derives from.
        $this->assertStringContainsString("__DIR__.'/laravel/", $patched);
        $this->assertNotSame($index, $patched, 'index.php has no relative requires left to rewrite.');
    }

    /** It must target the same bundle the rendered page will ask for. */
    public function test_it_reads_the_entry_bundle_from_the_apps_own_manifest(): void
    {
        $entry = $this->callPrivate('entryAsset');

        if (!is_file(public_path('build/manifest.json'))) {
            $this->assertNull($entry);
            return;
        }

        $this->assertNotNull($entry);
        $this->assertStringEndsWith('.js', $entry);
        $this->assertFileExists(public_path('build/' . $entry));

        // The shell really does reference it — otherwise we would be guarding
        // the wrong file and the blank page would survive the fix.
        $manifest = json_decode(file_get_contents(public_path('build/manifest.json')), true);
        $entries  = array_filter($manifest, fn ($c) => !empty($c['isEntry']) && str_ends_with($c['file'] ?? '', '.js'));
        $this->assertContains($entry, array_column($entries, 'file'));
    }

    public function test_it_mirrors_the_build_and_writes_the_manifest_last(): void
    {
        if (!is_file(public_path('build/manifest.json'))) {
            $this->markTestSkipped('No build present — run `npm run build` first.');
        }

        $docroot = $this->tempDir();
        $entry   = $this->callPrivate('entryAsset');

        $copied = $this->callPrivate('sync', $docroot);

        $this->assertGreaterThan(0, $copied);
        $this->assertFileExists($docroot . '/build/' . $entry, 'The bundle the shell asks for was not copied.');
        $this->assertFileExists($docroot . '/build/manifest.json');
        $this->assertFileEquals(public_path('build/' . $entry), $docroot . '/build/' . $entry);

        // The PWA files the deploy script's dead tail owns ride along.
        $this->assertFileExists($docroot . '/sw.js');
        $this->assertFileExists($docroot . '/manifest.webmanifest');
    }

    /**
     * The whole mechanism, against a replica of the real server layout:
     * `public_html/{index.php, build/}` beside `public_html/laravel/`.
     *
     * This is the scenario that actually happens — the web root holding an old
     * build while the app has moved on — so it is the one worth proving end to
     * end rather than only testing the copy helper in isolation.
     */
    public function test_it_heals_a_stale_web_root_in_the_real_layout(): void
    {
        $root = $this->tempDir();
        $app  = $root . '/laravel';          // basename must match the marker
        mkdir($app . '/public/build/assets', 0777, true);
        mkdir($root . '/build/assets', 0777, true);

        // The web root as the installer leaves it, plus a build from last deploy.
        file_put_contents($root . '/index.php', "<?php\nrequire __DIR__.'/laravel/vendor/autoload.php';\n");
        file_put_contents($root . '/build/assets/main-OLD.js', 'old');
        file_put_contents($root . '/build/manifest.json', '{"resources/js/main.jsx":{"file":"assets/main-OLD.js","isEntry":true}}');

        // The app, already advanced to a new hashed bundle.
        file_put_contents($app . '/public/build/assets/main-NEW.js', 'new bundle');
        file_put_contents($app . '/public/build/manifest.json', '{"resources/js/main.jsx":{"file":"assets/main-NEW.js","isEntry":true}}');
        file_put_contents($app . '/public/sw.js', 'sw');
        file_put_contents($app . '/public/manifest.webmanifest', '{}');

        $original = base_path();
        try {
            $this->app->setBasePath($app);

            // Precondition: this is exactly the blank-page state.
            $this->assertFileDoesNotExist($root . '/build/assets/main-NEW.js');

            DocrootBuild::ensure();

            $this->assertFileExists($root . '/build/assets/main-NEW.js', 'The stale web root was not healed.');
            $this->assertSame('new bundle', file_get_contents($root . '/build/assets/main-NEW.js'));
            $this->assertStringContainsString('main-NEW.js', file_get_contents($root . '/build/manifest.json'),
                'The web-root manifest still points at the old bundle.');
            $this->assertFileExists($root . '/sw.js', 'PWA files from the deploy tail were not synced.');
        } finally {
            $this->app->setBasePath($original);
        }
    }

    /** A repeat pass must be nearly free, or the lock would just move the cost around. */
    public function test_a_second_sync_copies_nothing(): void
    {
        if (!is_file(public_path('build/manifest.json'))) {
            $this->markTestSkipped('No build present.');
        }

        $docroot = $this->tempDir();
        $this->callPrivate('sync', $docroot);
        $second = $this->callPrivate('sync', $docroot);

        // manifest.json and the two root files are rewritten unconditionally;
        // the hundreds of hashed assets must not be.
        $this->assertLessThanOrEqual(3, $second, "Second pass re-copied {$second} files.");
    }

    /** rename() over an existing file behaves differently on Windows — prove it works here. */
    public function test_copy_overwrites_an_existing_destination(): void
    {
        $dir = $this->tempDir();
        $src = $dir . '/src.txt';
        $dst = $dir . '/dst.txt';
        file_put_contents($src, 'new');
        file_put_contents($dst, 'old');

        $this->assertTrue($this->callPrivate('copyFile', $src, $dst));
        $this->assertSame('new', file_get_contents($dst));
    }
}
