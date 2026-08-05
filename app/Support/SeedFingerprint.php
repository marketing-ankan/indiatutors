<?php
namespace App\Support;

use App\Models\Setting;
use Illuminate\Support\Facades\Schema;

/**
 * Lets a seeder skip itself when the data it seeds has not changed.
 *
 * WHY. The Hostinger deploy re-runs every seeder on every push. CourseSeeder
 * alone rewrites 134 courses, 112 categories and all their curriculum — work
 * that is pure waste when courses.json is byte-identical to last time, which is
 * almost always. That waste is the prime suspect for the deploy being killed
 * partway through: the script dies somewhere in the migrate/seed block and
 * never reaches the step that copies the new front-end build to the web root,
 * which is what shows visitors a blank page for ~5 minutes after every push.
 *
 * CONTENT hash, never mtime. Git does not preserve modification times, so every
 * `git pull` restamps the files it touches; an mtime fingerprint would look
 * "changed" on each deploy and skip nothing.
 *
 * The fingerprint lives in `settings`, not the cache: a cache flush must not
 * silently re-enable a 30-second seed on the next deploy.
 */
class SeedFingerprint
{
    private const PREFIX = 'seed_fp.';

    private static bool $bypass = false;

    /**
     * Run a seeder with the gate off.
     *
     * These seeders do two jobs: IMPORT the catalogue, and REPAIR data that has
     * drifted in the database. Only the first is wasteful to repeat — and a
     * fingerprint cannot see drift, because the source file is identical in both
     * cases. So repair callers say so explicitly. Without this, the curriculum
     * self-heal in CourseController would have become a silent no-op, which is a
     * worse bug than the one the gate fixes.
     *
     * From the command line: `SEED_FORCE=1 php artisan db:seed --class=…`.
     */
    public static function bypass(callable $fn): mixed
    {
        self::$bypass = true;
        try {
            return $fn();
        } finally {
            self::$bypass = false;
        }
    }

    /** @param string[] $paths files whose contents define "unchanged" */
    private function __construct(private string $key, private array $paths) {}

    /** @param string[] $paths */
    public static function for(string $key, array $paths): self
    {
        return new self($key, $paths);
    }

    /**
     * True when the inputs are byte-identical to the last successful run.
     *
     * Callers must AND this with their own "is the data actually present"
     * check — a matching fingerprint against an empty table means the database
     * was wiped, and skipping then would leave the site with no catalogue.
     */
    public function isCurrent(): bool
    {
        if (self::$bypass || getenv('SEED_FORCE')) return false;
        if (!$this->available()) return false;

        return Setting::get(self::PREFIX . $this->key) === $this->hash();
    }

    /** Record the inputs as seeded. Call only after the seeding succeeded. */
    public function stamp(): void
    {
        if (!$this->available()) return;

        Setting::put(self::PREFIX . $this->key, $this->hash());
    }

    // There is deliberately no adopt() — a way to claim "already seeded" without
    // running the seeder. It existed briefly to break a deadlock: the gate only
    // engages after a seeder completes once, and the deploy was being killed
    // inside that seeder. Reordering the deploy (assets before database) removed
    // the deadlock, and an adversarial review then showed the idea was unsound
    // anyway.
    //
    // The problem is that "the data already matches the source" cannot be proved
    // cheaply. A seeder does not only insert: CourseSeeder also prunes retired
    // courses, repairs drifted category slugs in place and clears empty
    // categories. Any practical check looks at rows that exist, so on a populated
    // production database it passes for a run that was killed half-way — and
    // stamping then cancels the repair permanently, whereas without a stamp the
    // deploy simply retries every five minutes until it succeeds.
    //
    // If a future caller really needs this, the check has to prove the seeder's
    // *removals and corrections* too, not just its inserts.

    /**
     * The settings table is created by a migration, and on this host migrations
     * are not guaranteed to have run. No table means no gate: seed every time,
     * which is the safe direction to fail in.
     */
    private function available(): bool
    {
        try {
            return Schema::hasTable('settings');
        } catch (\Throwable $e) {
            return false;
        }
    }

    private function hash(): string
    {
        $parts = array_map(
            fn (string $p) => is_file($p) ? md5_file($p) : 'missing:' . basename($p),
            $this->paths,
        );

        return md5(implode('|', $parts));
    }
}
