<?php
namespace App\Support;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * Keeps the web root's copy of the front-end build in step with the app.
 *
 * THE PROBLEM. On this Hostinger plan only `public_html` may serve files, so the
 * app lives in `public_html/laravel` (blocked from the web) and a COPY of the
 * built assets is kept at `public_html/build`. The deploy is supposed to refresh
 * that copy, but it does the heavy database work first and gets killed partway
 * through often enough that the copy is regularly skipped.
 *
 * When that happens the app has already advanced — the HTML it renders asks for
 * `main-<newhash>.js` — while the web root still holds the previous build. The
 * browser gets a 404 for the bundle and paints nothing. Measured cost of that
 * window on three consecutive deploys: 3.5, 4.9 and ~4 minutes of blank site,
 * ending only when the next cron cycle's own self-heal notices.
 *
 * THE FIX. The request that renders the shell is, by definition, the request
 * that is about to reference a bundle that may not be there. So check here, and
 * copy it across if it is missing. The window becomes one slightly slower
 * request instead of several minutes of white screen, with no cron, no SSH and
 * no waiting.
 *
 * This does not replace the deploy's copy — that one is authoritative and also
 * prunes. This is the safety net for when it does not run.
 */
class DocrootBuild
{
    private const LOCK = 'docroot_build_sync';
    private const TTL  = 86400;

    /** Extra web-root files the deploy script's tail owns — and has not run since 15 July. */
    private const ROOT_FILES = ['sw.js', 'manifest.webmanifest'];
    private const ROOT_DIRS  = ['icons'];

    /** Memo for webRoot(); see there. Null is a real answer, hence the flag. */
    private static ?string $webRoot = null;
    private static bool $webRootResolved = false;

    /**
     * Cheap on the happy path: read a ~1 KB manifest, one cache hit, return.
     *
     * Deliberately never throws. A failure here must degrade to the old
     * behaviour (wait for cron), never to a broken page.
     */
    public static function ensure(): void
    {
        try {
            $entry = self::entryAsset();
            if (!$entry) return;

            // Keyed BY the asset name, never cached as "the current entry": after
            // a deploy the name changes, so the key misses and we re-check. A
            // cached entry NAME would keep asserting the old bundle is fine and
            // leave the blank page in place — the exact bug this exists to fix.
            $key = self::LOCK . ':' . $entry;
            if (Cache::get($key)) return;

            // Only on a miss, so the steady state never pays for it.
            $docroot = self::webRoot();
            if (!$docroot) return;

            if (is_file($docroot . '/build/' . $entry)) {
                Cache::put($key, true, self::TTL);
                return;
            }

            // One syncer at a time. Everyone else renders now and gets the
            // working bundle on their next request — a second of staleness
            // beats a thundering herd of directory copies.
            if (!Cache::add(self::LOCK . ':lock', 1, 120)) return;

            $copied = self::sync($docroot);

            if (is_file($docroot . '/build/' . $entry)) {
                Cache::put($key, true, self::TTL);
                Log::info("DocrootBuild: web-root build was stale, synced {$copied} file(s) for {$entry}.");
            } else {
                Log::error("DocrootBuild: sync ran but {$entry} is still missing from the web root.");
            }
        } catch (\Throwable $e) {
            Log::error('DocrootBuild failed', ['error' => $e->getMessage()]);
        }
    }

    /**
     * The web root, but only when this really is the split Hostinger layout.
     *
     * Identified by its own signature: setup copies Laravel's public/index.php
     * up one level and rewrites `__DIR__.'/../` to `__DIR__.'/laravel/`. Nothing
     * else produces that. Without this check a local XAMPP install would happily
     * start copying builds into C:\xampp2\htdocs.
     *
     * Public because [[WebRootVite]] resolves the Vite manifest against the same
     * directory, and the two must never disagree about where the web root is —
     * one detector, one answer. Memoised: it reads the head of index.php, and on
     * the shell request it is now asked more than once. The layout cannot change
     * within a request, and statics do not survive between them.
     */
    public static function webRoot(): ?string
    {
        if (self::$webRootResolved) return self::$webRoot;

        self::$webRootResolved = true;
        self::$webRoot = null;

        $dir = dirname(base_path());
        $idx = $dir . '/index.php';

        if (!is_dir($dir) || !is_file($idx)) return null;
        if (realpath($dir) === realpath(public_path())) return null;

        $head = @file_get_contents($idx, false, null, 0, 4096);
        if (!$head) return null;

        if (str_contains($head, "__DIR__.'/" . basename(base_path()) . "/")) {
            self::$webRoot = $dir;
        }

        return self::$webRoot;
    }

    /**
     * The hashed main bundle the shell is about to ask for, per the app's own
     * manifest.
     *
     * Deliberately NOT memoised. The whole mechanism turns on noticing that this
     * value changed; caching it would mean a deploy could not be detected, which
     * is the failure this class exists to prevent. It is a ~1 KB read the OS
     * keeps in page cache.
     */
    private static function entryAsset(): ?string
    {
        $manifest = public_path('build/manifest.json');
        if (!is_file($manifest)) return null;

        $json = json_decode((string) @file_get_contents($manifest), true);
        if (!is_array($json)) return null;

        foreach ($json as $chunk) {
            if (!empty($chunk['isEntry']) && str_ends_with($chunk['file'] ?? '', '.js')) {
                return $chunk['file'];
            }
        }

        return null;
    }

    /**
     * Merge-copy, not replace: the web root is never left without a build, even
     * for the instant a delete-and-swap would take. Safe because Vite asset
     * names carry a content hash — a new build only ADDS filenames, it cannot
     * collide with an old one. Stale files linger until the next real deploy
     * prunes them, which costs disk and nothing else.
     *
     * manifest.json is written LAST, so the file that points at the assets never
     * lands before the assets themselves.
     */
    private static function sync(string $docroot): int
    {
        $copied = self::mirror(public_path('build'), $docroot . '/build', skip: ['manifest.json']);

        // The deploy tail also owns these and has not run in weeks. Same copy,
        // same moment — a few files, and it keeps the PWA from drifting.
        foreach (self::ROOT_FILES as $file) {
            $copied += self::copyFile(public_path($file), $docroot . '/' . $file) ? 1 : 0;
        }
        foreach (self::ROOT_DIRS as $sub) {
            $copied += self::mirror(public_path($sub), $docroot . '/' . $sub);
        }

        // Now the pointer.
        $copied += self::copyFile(public_path('build/manifest.json'), $docroot . '/build/manifest.json') ? 1 : 0;

        return $copied;
    }

    /** @param string[] $skip relative paths not to copy */
    private static function mirror(string $src, string $dst, array $skip = []): int
    {
        if (!is_dir($src)) return 0;
        if (!is_dir($dst) && !@mkdir($dst, 0755, true) && !is_dir($dst)) return 0;

        $copied = 0;
        $it = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($src, \FilesystemIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::SELF_FIRST,
        );

        foreach ($it as $item) {
            $rel    = str_replace('\\', '/', $it->getSubPathName());
            $target = $dst . '/' . $rel;

            if ($item->isDir()) {
                if (!is_dir($target)) @mkdir($target, 0755, true);
                continue;
            }
            if (in_array($rel, $skip, true)) continue;

            // Same name + same size is the same file: asset names are content
            // hashed, so this makes a repeat pass nearly free.
            if (is_file($target) && filesize($target) === $item->getSize()) continue;

            if (self::copyFile($item->getPathname(), $target)) $copied++;
        }

        return $copied;
    }

    private static function copyFile(string $src, string $dst): bool
    {
        if (!is_file($src)) return false;

        $dir = dirname($dst);
        if (!is_dir($dir) && !@mkdir($dir, 0755, true) && !is_dir($dir)) return false;

        // Write beside the target then rename: a reader never sees half a file.
        $tmp = $dst . '.tmp' . getmypid();
        if (!@copy($src, $tmp)) return false;
        if (!@rename($tmp, $dst)) { @unlink($tmp); return false; }

        return true;
    }
}
