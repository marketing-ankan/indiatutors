<?php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

/**
 * Make sure the physical-tuition tables (and their pincode reference data)
 * actually exist before serving a request that needs them.
 *
 * WHY THIS EXISTS. On this host the deploy's own `migrate` / `db:seed` steps are
 * not dependable — they have been observed dying mid-script often enough that
 * the deploy script wraps them in `set +e` specifically so their failure cannot
 * take the front-end down with it. The same lesson already produced the lazy
 * CourseSeeder heal in CourseController: anything that must reach the server's
 * DB ships as app-triggered idempotent code and never relies on the deploy's
 * artisan steps.
 *
 * Without this, a deploy whose DB block died would leave every home-tuition
 * endpoint 500ing against a missing table — and the teacher dashboard renders
 * one of them on load, so the failure would be the first thing a teacher sees.
 *
 * Cheap on the happy path: one cache read, no schema query. The heal is
 * lock-guarded so a burst of traffic cannot stampede `migrate`, and every
 * migration involved is `hasTable`-guarded, so re-running is a no-op.
 */
class EnsurePhysicalSchema
{
    private const SENTINEL   = 'physical_teaching_profiles';
    private const OK_KEY     = 'physical_schema_ok';
    private const LOCK_KEY   = 'physical_schema_heal_lock';
    private const OK_TTL     = 86400;   // a day; the tables do not come and go
    private const RETRY_TTL  = 600;     // at most one heal attempt per 10 minutes

    public function handle(Request $request, Closure $next)
    {
        if (Cache::get(self::OK_KEY)) return $next($request);

        if ($this->healthy()) {
            Cache::put(self::OK_KEY, true, self::OK_TTL);
            return $next($request);
        }

        $this->heal();

        // Still not there — the heal is throttled, or migrate genuinely failed.
        // 503 with a real explanation beats a stack trace about a missing table:
        // this is a deployment state, not a bug in the request.
        abort_unless($this->healthy(), 503,
            'Home tuition is still being set up on this server. Please try again in a few minutes.');

        Cache::put(self::OK_KEY, true, self::OK_TTL);
        return $next($request);
    }

    private function healthy(): bool
    {
        try {
            return Schema::hasTable(self::SENTINEL) && Schema::hasTable('pincodes');
        } catch (\Throwable $e) {
            return false;
        }
    }

    private function heal(): void
    {
        // Cache::add is atomic, so exactly one request in the window heals.
        if (!Cache::add(self::LOCK_KEY, 1, self::RETRY_TTL)) return;

        try {
            Artisan::call('migrate', ['--force' => true]);
            Log::info('Physical-tuition schema self-healed (deploy migrate had not run).');
        } catch (\Throwable $e) {
            Log::error('Physical-tuition schema heal failed', ['error' => $e->getMessage()]);
        }

        $this->seedPincodes();
    }

    /**
     * The anchor pincodes are seeded from the deploy script's tail, which on
     * this host is the least reliable part of the least reliable step. Without
     * them the address forms have no coordinates at all, so a teacher's service
     * radius has no centre — the module's whole premise. Idempotent upsert, and
     * PincodeSeeder skips rows an official `pincodes:import` has loaded.
     */
    private function seedPincodes(): void
    {
        try {
            if (!Schema::hasTable('pincodes')) return;
            if (DB::table('pincodes')->exists()) return;

            Artisan::call('db:seed', [
                '--class' => \Database\Seeders\PincodeSeeder::class,
                '--force' => true,
            ]);
            Log::info('Pincode anchors self-seeded.');
        } catch (\Throwable $e) {
            // Never fatal: the forms still work, they just fall back to the
            // India Post lookup for district/state and carry no coordinates.
            Log::error('Pincode anchor seeding failed', ['error' => $e->getMessage()]);
        }
    }
}
