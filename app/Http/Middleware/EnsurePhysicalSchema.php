<?php
namespace App\Http\Middleware;

use App\Support\SchemaHealer;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

/**
 * Guards the physical-tuition routes, and seeds the pincode reference data the
 * deploy script is meant to load.
 *
 * The generic half — check, migrate once behind a lock, 503 honestly if it still
 * cannot — lives in App\Support\SchemaHealer, shared with EnsureSupportSchema.
 * Only the pincode seed is specific to this feature: without those rows an
 * address has no coordinates, so a teacher's service radius has no centre.
 *
 * Without this guard, a deploy whose DB block died would leave every
 * home-tuition endpoint 500ing against a missing table — and the teacher
 * dashboard renders one of them on load, so it would be the first thing a
 * teacher sees.
 */
class EnsurePhysicalSchema
{
    private const SENTINEL = 'physical_teaching_profiles';

    public function handle(Request $request, Closure $next)
    {
        // Shared with EnsureSupportSchema — see App\Support\SchemaHealer. The
        // pincode seed is the part unique to this feature.
        SchemaHealer::ensure(
            [self::SENTINEL, 'pincodes'],
            'physical',
            'Home tuition',
            fn () => $this->seedPincodes(),
        );

        return $next($request);
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
