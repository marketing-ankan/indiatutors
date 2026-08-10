<?php
namespace App\Support;

use App\Models\PhysicalTeachingProfile;

/**
 * The one place that decides whether a physical-teaching profile can plausibly
 * serve a point, and how a set of qualifying profiles is ordered.
 *
 * Shared by the matching EXPORT (/api/matching/v1/teachers?near=) and the
 * Staff Console's read-only suggestion panels. Both must agree on what
 * "reachable" means, so the rules live here and nowhere else. This class only
 * measures — deciding WHO is actually assigned stays in the leads-management
 * software (see AdminPhysicalController::updateRequirement for why).
 */
class TeacherMatcher
{
    /**
     * Why $p can serve the target, or null when it can't. Reasons carry the
     * semantics documented on the export:
     *   same_pincode   — profile pincode equals the target
     *   listed_pincode — target appears in extra_pincodes (explicit opt-in,
     *                    reachable regardless of distance)
     *   within_radius  — haversine distance <= their service_radius_km
     *   nearby         — within $withinKm but outside their stated radius;
     *                    a "would you stretch?" candidate, ranked last
     *
     * $centre may lack coordinates (unknown pincode) — the pincode reasons
     * still apply; only the distance-based ones need a resolvable point.
     *
     * @return array{km: ?float, reasons: string[]}|null
     */
    public static function qualify(PhysicalTeachingProfile $p, string $pin, array $centre, float $withinKm): ?array
    {
        $reasons = [];
        $km      = null;

        if ((string) $p->pincode === $pin) {
            $reasons[] = 'same_pincode';
        }
        // extra_pincodes is a CSV *string* column — csv() splits and trims.
        // The old inline check did `(array) $p->extra_pincodes`, which wraps
        // the whole string as one element, so "700091, 700064" (the form's
        // own placeholder format) never matched and listed_pincode never
        // fired. Fixed here 2026-08-07 for the export and console together.
        if (in_array($pin, $p->csv('extra_pincodes'), true)) {
            $reasons[] = 'listed_pincode';
        }
        if ($p->latitude !== null && $p->longitude !== null
            && isset($centre['latitude'], $centre['longitude']) && $centre['latitude'] !== null) {
            $km = self::haversineKm(
                (float) $centre['latitude'], (float) $centre['longitude'],
                (float) $p->latitude, (float) $p->longitude
            );
            if ((float) $p->service_radius_km > 0 && $km <= (float) $p->service_radius_km) {
                $reasons[] = 'within_radius';
            } elseif ($km <= $withinKm && ! $reasons) {
                $reasons[] = 'nearby';
            }
        }

        return $reasons ? ['km' => $km, 'reasons' => $reasons] : null;
    }

    /**
     * Hard qualifiers first, then plain distance. 'nearby' rows sink.
     * Expects a collection of arrays that carry 'km' and 'reasons'.
     */
    public static function rank($rows)
    {
        return $rows->sortBy([
            fn ($a, $b) => (int) ($a['reasons'] === ['nearby']) <=> (int) ($b['reasons'] === ['nearby']),
            fn ($a, $b) => ($a['km'] ?? 9e9) <=> ($b['km'] ?? 9e9),
        ]);
    }

    public static function haversineKm(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $r = 6371.0;
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);
        $a = sin($dLat / 2) ** 2
           + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;

        return 2 * $r * asin(min(1.0, sqrt($a)));
    }
}
