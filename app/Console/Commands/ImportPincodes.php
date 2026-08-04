<?php
namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Load the full Indian pincode directory over the bundled starter set.
 *
 *     php artisan pincodes:import storage/app/pincodes.csv
 *
 * Written against the shape the open datasets ship in (data.gov.in's "All India
 * Pincode Directory", and the community CSVs derived from it): one row per post
 * office, with the pincode repeated. Column names differ between releases, so
 * the header is matched loosely rather than by position — a file with
 * "Pincode,OfficeName,District,StateName,Latitude,Longitude" and one with
 * "pincode,office,districtname,statename,lat,long" both load.
 *
 * Offices collapse into one row per pincode: we need a centre to measure a
 * radius from, and the office names become the area dropdown on the address
 * form.
 */
class ImportPincodes extends Command
{
    protected $signature   = 'pincodes:import {file : Path to the CSV (absolute, or relative to the project root)}
                                              {--truncate : Empty the table first instead of merging}';
    protected $description = 'Import the India Post pincode directory (pincode, district, state, lat/long)';

    private const ALIASES = [
        'pincode'  => ['pincode', 'pin_code', 'pin', 'postalcode', 'postal_code'],
        'office'   => ['officename', 'office_name', 'office', 'name', 'post_office'],
        'district' => ['district', 'districtname', 'district_name'],
        'state'    => ['statename', 'state_name', 'state', 'circlename'],
        'lat'      => ['latitude', 'lat'],
        'lng'      => ['longitude', 'long', 'lon', 'lng'],
    ];

    public function handle(): int
    {
        $path = $this->argument('file');
        if (!is_file($path)) $path = base_path($path);
        if (!is_file($path)) { $this->error("No such file: {$this->argument('file')}"); return self::FAILURE; }

        $fh = fopen($path, 'r');
        if (!$fh) { $this->error('Could not open the file for reading.'); return self::FAILURE; }

        $header = fgetcsv($fh);
        if (!$header) { fclose($fh); $this->error('The file is empty.'); return self::FAILURE; }

        $col = $this->mapColumns($header);
        if ($col['pincode'] === null) {
            fclose($fh);
            $this->error('No pincode column found. Header was: ' . implode(', ', $header));
            return self::FAILURE;
        }

        if ($this->option('truncate')) DB::table('pincodes')->delete();

        // Aggregated in memory rather than row-by-row upserts: the directory is
        // ~155k office rows and one write per row would take minutes.
        $acc  = [];
        $read = 0;
        while (($row = fgetcsv($fh)) !== false) {
            $read++;
            $pin = preg_replace('/\D/', '', (string) ($row[$col['pincode']] ?? ''));
            if (strlen($pin) !== 6) continue;

            $acc[$pin] ??= ['district' => null, 'state' => null, 'localities' => [], 'lat' => [], 'lng' => []];
            $get = fn (?int $i) => $i === null ? null : (trim((string) ($row[$i] ?? '')) ?: null);

            $acc[$pin]['district'] ??= $get($col['district']);
            $acc[$pin]['state']    ??= $get($col['state']);
            if ($office = $get($col['office'])) $acc[$pin]['localities'][$office] = true;

            $lat = $get($col['lat']); $lng = $get($col['lng']);
            // Some releases carry "NA" in the coordinate columns; and 0,0 is in
            // the Atlantic, not in India.
            if (is_numeric($lat) && is_numeric($lng) && abs((float) $lat) > 0.001) {
                $acc[$pin]['lat'][] = (float) $lat;
                $acc[$pin]['lng'][] = (float) $lng;
            }
        }
        fclose($fh);

        $now = now();
        $bar = $this->output->createProgressBar(count($acc));
        $written = 0;

        foreach (array_chunk($acc, 500, true) as $chunk) {
            $payload = [];
            foreach ($chunk as $pin => $d) {
                $payload[] = [
                    'pincode'    => $pin,
                    'district'   => $d['district'],
                    'state'      => $d['state'],
                    'localities' => json_encode(array_slice(array_keys($d['localities']), 0, 40)),
                    'latitude'   => $d['lat'] ? round(array_sum($d['lat']) / count($d['lat']), 7) : null,
                    'longitude'  => $d['lng'] ? round(array_sum($d['lng']) / count($d['lng']), 7) : null,
                    'source'     => 'import',
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
            DB::table('pincodes')->upsert($payload, ['pincode'],
                ['district', 'state', 'localities', 'latitude', 'longitude', 'source', 'updated_at']);
            $written += count($payload);
            $bar->advance(count($payload));
        }
        $bar->finish();

        $withCoords = DB::table('pincodes')->whereNotNull('latitude')->count();
        $this->newLine(2);
        $this->info("Read {$read} rows → wrote {$written} pincodes ({$withCoords} now have coordinates).");
        if (!$withCoords) {
            $this->warn('None of the rows carried coordinates — radius matching will fall back to the 3-digit approximation. Look for a dataset with latitude/longitude columns.');
        }

        return self::SUCCESS;
    }

    /** @return array<string,?int> */
    private function mapColumns(array $header): array
    {
        $norm = array_map(fn ($h) => preg_replace('/[^a-z]/', '', strtolower((string) $h)), $header);
        $out  = [];
        foreach (self::ALIASES as $key => $names) {
            $out[$key] = null;
            foreach ($names as $name) {
                $i = array_search(preg_replace('/[^a-z]/', '', $name), $norm, true);
                if ($i !== false) { $out[$key] = $i; break; }
            }
        }
        return $out;
    }
}
