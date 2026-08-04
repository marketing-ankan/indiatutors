<?php
namespace App\Support;

/**
 * One numeric scale for "what class is this".
 *
 * Grades arrive as free text from five different forms ("Class 10", "10th",
 * "X", "Grade 10"). A matcher cannot range-check strings, so everything is
 * normalised to an ordinal the moment it is stored:
 *
 *   0  = Pre-primary / nursery / KG
 *   1–12 = Class 1 … Class 12
 *   13 = Above Class 12 (college, adult learner, skill course)
 *
 * The JS side mirrors this in resources/js/data/physical.js — keep both in step.
 */
class GradeScale
{
    public const PRE_PRIMARY = 0;
    public const BEYOND      = 13;

    /** Human label for an ordinal. */
    public static function label(?int $n): ?string
    {
        if ($n === null) return null;
        if ($n <= 0)  return 'Pre-primary';
        if ($n >= 13) return 'Above Class 12';
        return "Class $n";
    }

    /** Free text -> ordinal. Returns null when there is nothing recognisable. */
    public static function parse(int|string|null $value): ?int
    {
        if ($value === null || $value === '') return null;
        if (is_int($value)) return max(0, min(13, $value));

        $s = strtolower(trim($value));
        if ($s === '') return null;
        if (preg_match('/nursery|pre[- ]?prim|pre[- ]?school|kg|kinder|lkg|ukg/', $s)) return self::PRE_PRIMARY;
        if (preg_match('/college|graduat|adult|beyond|above/', $s)) return self::BEYOND;

        if (preg_match('/(\d{1,2})/', $s, $m)) {
            $n = (int) $m[1];
            if ($n >= 1 && $n <= 12) return $n;
        }

        // Roman numerals are still common on school paperwork.
        static $roman = ['xii' => 12, 'xi' => 11, 'x' => 10, 'ix' => 9, 'viii' => 8, 'vii' => 7,
                         'vi' => 6, 'v' => 5, 'iv' => 4, 'iii' => 3, 'ii' => 2, 'i' => 1];
        foreach ($roman as $r => $n) {
            if (preg_match('/\b' . $r . '\b/', $s)) return $n;
        }

        return null;
    }

    /** The full picker list, for the reference endpoint the matching app reads. */
    public static function all(): array
    {
        return array_map(fn ($n) => ['value' => $n, 'label' => self::label($n)], range(0, 13));
    }
}
