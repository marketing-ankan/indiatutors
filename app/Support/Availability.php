<?php
namespace App\Support;

/**
 * Availability normalisation + overlap.
 *
 * Forms hand us availability in whichever shape was convenient for the widget:
 * the apply page paints an hour grid ({"Mon":[17,18,19]}), the dashboard editor
 * posts real ranges. Everything lands here first and leaves as one shape —
 * (weekday, start, end) — because the question the leads-management software
 * asks of it is "do these two people share an hour", and that question can only
 * be answered against ranges. Free text like "5-8pm weekdays" cannot be
 * intersected with anything, which is why it is normalised on the way in rather
 * than stored as typed.
 */
class Availability
{
    public const DAYS = [1 => 'Mon', 2 => 'Tue', 3 => 'Wed', 4 => 'Thu', 5 => 'Fri', 6 => 'Sat', 7 => 'Sun'];

    private const DAY_NUMBER = [
        'mon' => 1, 'monday' => 1, 'tue' => 2, 'tues' => 2, 'tuesday' => 2,
        'wed' => 3, 'wednesday' => 3, 'thu' => 4, 'thur' => 4, 'thurs' => 4, 'thursday' => 4,
        'fri' => 5, 'friday' => 5, 'sat' => 6, 'saturday' => 6, 'sun' => 7, 'sunday' => 7,
    ];

    /**
     * Any accepted shape -> [['weekday'=>1,'start_time'=>'17:00:00','end_time'=>'20:00:00'], …]
     * Contiguous and overlapping ranges are merged, so 5–6, 6–7 and 6–8 become one 5–8.
     */
    public static function normalize(mixed $input): array
    {
        if (empty($input) || !is_array($input)) return [];

        $byDay = [];

        foreach ($input as $key => $value) {
            // Shape A — an hour grid keyed by day: {"Mon":[17,18], "3":[9]}
            if (is_array($value) && !isset($value['start_time']) && !isset($value['start'])) {
                $day = self::dayNumber($key);
                if (!$day) continue;
                foreach ($value as $hour) {
                    if (!is_numeric($hour)) continue;
                    $h = (int) $hour;
                    if ($h < 0 || $h > 23) continue;
                    $byDay[$day][] = [$h * 60, ($h + 1) * 60];
                }
                continue;
            }

            // Shape B — explicit ranges: {"weekday":1,"start_time":"17:00","end_time":"20:00"}
            if (is_array($value)) {
                $day   = self::dayNumber($value['weekday'] ?? $value['day'] ?? $key);
                $start = self::minutes($value['start_time'] ?? $value['start'] ?? null);
                $end   = self::minutes($value['end_time'] ?? $value['end'] ?? null);
                if (!$day || $start === null || $end === null || $end <= $start) continue;
                $byDay[$day][] = [$start, $end];
            }
        }

        $out = [];
        foreach ($byDay as $day => $ranges) {
            foreach (self::merge($ranges) as [$start, $end]) {
                $out[] = [
                    'weekday'    => $day,
                    'start_time' => self::hhmmss($start),
                    'end_time'   => self::hhmmss($end),
                ];
            }
        }

        usort($out, fn ($a, $b) => [$a['weekday'], $a['start_time']] <=> [$b['weekday'], $b['start_time']]);
        return $out;
    }

    /**
     * Total hours a week a teacher has declared.
     *
     * A summary of one record, not a comparison between two: there is
     * deliberately no "how much does this teacher overlap with this family"
     * function here. Intersecting the two sides is matching, and matching lives
     * in the leads-management software — which is why the export ships the raw
     * ranges alongside this number rather than any verdict about them.
     */
    public static function weeklyHours(array $slots): float
    {
        $total = 0;
        foreach ($slots as $slot) {
            $s = self::minutes($slot['start_time'] ?? null);
            $e = self::minutes($slot['end_time'] ?? null);
            if ($s === null || $e === null || $e <= $s) continue;
            $total += $e - $s;
        }

        return round($total / 60, 1);
    }

    public static function dayNumber(mixed $key): ?int
    {
        if (is_numeric($key)) {
            $n = (int) $key;
            return ($n >= 1 && $n <= 7) ? $n : null;
        }
        return self::DAY_NUMBER[strtolower(trim((string) $key))] ?? null;
    }

    /** "17:00" / "17:00:00" / "5" -> minutes past midnight. */
    private static function minutes(mixed $time): ?int
    {
        if ($time === null || $time === '') return null;
        if (is_numeric($time) && !str_contains((string) $time, ':')) {
            $h = (int) $time;
            return ($h >= 0 && $h <= 24) ? $h * 60 : null;
        }
        if (!preg_match('/^(\d{1,2}):(\d{2})/', (string) $time, $m)) return null;
        $h = (int) $m[1]; $i = (int) $m[2];
        if ($h > 24 || $i > 59) return null;
        return $h * 60 + $i;
    }

    private static function hhmmss(int $minutes): string
    {
        $minutes = min($minutes, 1439);   // 24:00 is not a storable TIME on every driver
        return sprintf('%02d:%02d:00', intdiv($minutes, 60), $minutes % 60);
    }

    /** @param array<int,array{0:int,1:int}> $ranges */
    private static function merge(array $ranges): array
    {
        usort($ranges, fn ($a, $b) => $a[0] <=> $b[0]);
        $out = [];
        foreach ($ranges as $r) {
            $n = count($out);
            if ($n && $r[0] <= $out[$n - 1][1]) {
                $out[$n - 1][1] = max($out[$n - 1][1], $r[1]);
            } else {
                $out[] = $r;
            }
        }
        return $out;
    }
}
