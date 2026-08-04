<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Anchor pincodes — one or more per major city, plus dense cover of Kolkata,
 * where the tutors we actually have are based.
 *
 * This is a STARTER set, not the postal directory. It exists so that:
 *  - the address form autofills district/state for the pincodes most visitors
 *    type, without a network round trip;
 *  - PincodeDirectory has neighbours to approximate from — the first three
 *    digits are the postal sorting district, so any unseeded pincode still
 *    resolves to roughly the right city;
 *  - radius matching works out of the box on a fresh install.
 *
 * Coordinates are city/area centroids to about a kilometre. For exact figures
 * load the official India Post dataset over the top:
 *     php artisan pincodes:import storage/app/pincodes.csv
 * which overwrites these rows and re-tags them `import`.
 */
class PincodeSeeder extends Seeder
{
    public function run(): void
    {
        $rows = json_decode(file_get_contents(__DIR__ . '/data/pincodes.json'), true);
        $now  = now();

        $payload = array_map(fn ($r) => [
            'pincode'    => $r[0],
            'district'   => $r[1],
            'state'      => $r[2],
            'latitude'   => $r[3],
            'longitude'  => $r[4],
            'localities' => json_encode($r[5]),
            'source'     => 'seed',
            'created_at' => $now,
            'updated_at' => $now,
        ], $rows);

        // upsert, so re-seeding never duplicates and never clobbers a row that
        // `pincodes:import` has since replaced with official data — those are
        // filtered out first.
        $imported = DB::table('pincodes')->whereIn('source', ['import', 'manual'])->pluck('pincode')->all();
        $payload  = array_values(array_filter($payload, fn ($p) => !in_array($p['pincode'], $imported, true)));

        foreach (array_chunk($payload, 200) as $chunk) {
            DB::table('pincodes')->upsert($chunk, ['pincode'], ['district', 'state', 'latitude', 'longitude', 'localities', 'source', 'updated_at']);
        }

        $this->command?->info('Seeded ' . count($payload) . ' anchor pincodes.');
    }
}
