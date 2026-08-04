<?php
namespace App\Support;

use App\Models\Pincode;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Pincode -> district / state / area list / centroid.
 *
 * Three sources, tried in order, because no single one is both complete and
 * free:
 *
 *  1. the `pincodes` table — the bundled starter set plus anything
 *     `php artisan pincodes:import` has loaded. Authoritative, has coordinates.
 *  2. India Post's open endpoint (api.postalpincode.in) — covers every pincode
 *     in the country and needs no key, but returns no coordinates. Whatever it
 *     answers is written back to the table, so each pincode costs one call ever.
 *  3. the average of known coordinates sharing the first three digits. Those
 *     three digits are the postal sorting district, so the guess lands inside
 *     the right corner of the right city — good enough to rank candidates,
 *     never good enough to pretend it is exact. Flagged `approx` so the
 *     matching app can discount it.
 *
 * The address form's real answer to accuracy is the "use my current location"
 * button, which gives an exact fix for free. This is the fallback for the
 * teacher who declines it.
 */
class PincodeDirectory
{
    private const API      = 'https://api.postalpincode.in/pincode/';
    private const MISS_TTL = 86400;   // remember a dud pincode for a day

    /** @return array{pincode:string,district:?string,state:?string,localities:array,latitude:?float,longitude:?float,source:string}|null */
    public static function lookup(string $pincode): ?array
    {
        $pin = preg_replace('/\D/', '', $pincode);
        if (strlen($pin) !== 6) return null;

        $row = Pincode::find($pin);
        if ($row && $row->district && $row->hasCoordinates()) return self::shape($row);

        if (!$row || !$row->district) {
            $row = self::fromIndiaPost($pin) ?? $row;
        }
        if (!$row) return null;

        if (!$row->hasCoordinates()) {
            [$lat, $lng] = self::approximateFromNeighbours($pin);
            if ($lat !== null) {
                $row->forceFill(['latitude' => $lat, 'longitude' => $lng, 'source' => 'approx'])->save();
            }
        }

        return self::shape($row);
    }

    /**
     * Fill the district / state / coordinates of an address payload from its
     * pincode. Shared by the teacher profile and the student requirement so
     * both sides of a match are geocoded the same way — a distance computed
     * between a device fix and a pincode centroid is only as good as the worse
     * of the two, and it has to be the same "worse" on every row.
     *
     * A `device` fix already on the record always wins: the browser gave us the
     * real point, free, and no centroid improves on it.
     *
     * @param array $attrs   the incoming (validated) address fields
     * @param array $current ['latitude' => ?float, 'geo_source' => ?string] already stored
     */
    public static function enrich(array $attrs, array $current = []): array
    {
        $pin = $attrs['pincode'] ?? null;
        if (!$pin) return $attrs;

        $ref = self::lookup($pin);
        if (!$ref) return $attrs;

        if (empty($attrs['district'])) $attrs['district'] = $ref['district'];
        if (empty($attrs['state']))    $attrs['state']    = $ref['state'];

        $lat    = $attrs['latitude']   ?? ($current['latitude'] ?? null);
        $source = $attrs['geo_source'] ?? ($current['geo_source'] ?? null);
        if ($lat !== null && $source === 'device') return $attrs;

        if ($ref['latitude'] !== null) {
            $attrs['latitude']   = $ref['latitude'];
            $attrs['longitude']  = $ref['longitude'];
            $attrs['geo_source'] = $ref['source'] === 'approx' ? 'approx' : 'pincode';
        }

        return $attrs;
    }

    private static function shape(Pincode $p): array
    {
        return [
            'pincode'    => $p->pincode,
            'district'   => $p->district,
            'state'      => $p->state,
            'localities' => $p->localities ?? [],
            'latitude'   => $p->latitude,
            'longitude'  => $p->longitude,
            'source'     => $p->source,
        ];
    }

    private static function fromIndiaPost(string $pin): ?Pincode
    {
        if (!config('services.pincode.lookup_api', true)) return null;
        // A pincode that does not exist must not cost a 3-second timeout on
        // every keystroke-triggered retry.
        if (Cache::get("pincode_miss:$pin")) return null;

        try {
            $res = Http::timeout(4)->retry(1, 200)->acceptJson()->get(self::API . $pin);
            $body = $res->successful() ? $res->json() : null;
            $entry = $body[0] ?? null;

            if (!$entry || ($entry['Status'] ?? '') !== 'Success' || empty($entry['PostOffice'])) {
                Cache::put("pincode_miss:$pin", true, self::MISS_TTL);
                return null;
            }

            $offices    = $entry['PostOffice'];
            $localities = array_values(array_unique(array_filter(array_map(
                fn ($o) => $o['Name'] ?? null, $offices
            ))));

            return tap(Pincode::firstOrNew(['pincode' => $pin]), function (Pincode $p) use ($offices, $localities) {
                $p->fill([
                    'district'   => $offices[0]['District'] ?? null,
                    'state'      => $offices[0]['State'] ?? null,
                    'localities' => $localities,
                    // 'api' records that we know the place but not the point.
                    'source'     => $p->hasCoordinates() ? $p->source : 'api',
                ])->save();
            });
        } catch (\Throwable $e) {
            // A directory lookup failing must never break the form the teacher
            // is filling in — they can still type the district themselves.
            Log::warning('Pincode lookup failed', ['pincode' => $pin, 'error' => $e->getMessage()]);
            return null;
        }
    }

    /** @return array{0:?float,1:?float} */
    private static function approximateFromNeighbours(string $pin): array
    {
        $rows = Pincode::where('pincode', 'like', substr($pin, 0, 3) . '%')
            ->whereNotNull('latitude')->whereIn('source', ['seed', 'import', 'manual'])
            ->limit(50)->get(['latitude', 'longitude']);

        if ($rows->isEmpty()) return [null, null];

        return [
            round($rows->avg('latitude'), 7),
            round($rows->avg('longitude'), 7),
        ];
    }
}
