<?php
namespace App\Support;

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

/**
 * Make sure a feature's tables exist before serving a request that needs them.
 *
 * WHY. On this host the deploy's `migrate` step is not dependable — it has been
 * observed dying often enough that deploy/deploy.sh runs it LAST, after
 * everything a visitor can see, and retries it every cycle until it succeeds.
 * That protects the site, but it does not help a page whose data lives in a
 * table the failed migration was supposed to create.
 *
 * So features that ship with a migration guard their own routes with this. It is
 * the same pattern the repo already settled on for seeders (CourseController's
 * lazy heal): anything that must reach the server's database ships as
 * app-triggered idempotent code and never relies on deploy-time artisan.
 *
 * Cheap: one cache hit on the happy path, no schema query. The heal is
 * lock-guarded so traffic cannot stampede `migrate`, and every migration here is
 * `hasTable`-guarded, so re-running is a no-op.
 */
class SchemaHealer
{
    private const OK_TTL    = 86400;   // a day; tables do not come and go
    private const RETRY_TTL = 600;     // at most one heal attempt per 10 minutes

    /**
     * @param string[]  $tables  every table the feature needs
     * @param string    $key     cache namespace for this feature
     * @param string    $label   what to call the feature in the 503
     * @param ?callable $after   optional extra work once migrations have run
     */
    public static function ensure(array $tables, string $key, string $label, ?callable $after = null): void
    {
        $okKey = "schema_ok:$key";
        if (Cache::get($okKey)) return;

        if (self::healthy($tables)) {
            Cache::put($okKey, true, self::OK_TTL);
            return;
        }

        // Cache::add is atomic, so exactly one request in the window heals.
        if (Cache::add("schema_heal:$key", 1, self::RETRY_TTL)) {
            try {
                Artisan::call('migrate', ['--force' => true]);
                Log::info("Schema self-healed for {$key} (deploy migrate had not run).");
            } catch (\Throwable $e) {
                Log::error("Schema heal failed for {$key}", ['error' => $e->getMessage()]);
            }

            if ($after) {
                try { $after(); } catch (\Throwable $e) {
                    Log::error("Post-heal step failed for {$key}", ['error' => $e->getMessage()]);
                }
            }
        }

        // Still missing — the heal is throttled, or migrate genuinely failed. A
        // 503 saying so beats a stack trace about an unknown table: this is a
        // deployment state, not a fault in the request.
        abort_unless(self::healthy($tables), 503,
            "{$label} is still being set up on this server. Please try again in a few minutes.");

        Cache::put($okKey, true, self::OK_TTL);
    }

    /** @param string[] $tables */
    private static function healthy(array $tables): bool
    {
        try {
            foreach ($tables as $table) {
                if (!Schema::hasTable($table)) return false;
            }
            return true;
        } catch (\Throwable $e) {
            // No database at all, or no cache table to have answered from —
            // either way we cannot claim the feature is ready.
            return false;
        }
    }
}
