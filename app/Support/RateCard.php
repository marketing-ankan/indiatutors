<?php
namespace App\Support;

/**
 * The owner's official per-class rates, server-side.
 *
 * The product page lets a buyer choose One-to-One vs Group and a level, and
 * quotes the rate from the owner's "IN Plan and Pricing" sheet. "Add to Cart"
 * then ignored that choice and the order was priced from the catalogue column
 * instead — which holds the CHEAPEST rate (the group rate where a course has
 * one). So a Chess order placed from a page advertising ₹600 was totalled at
 * ₹300, and no payment keys are needed for that order to exist.
 *
 * The rates live in database/data/rates.json, which resources/js/data/pricing.js
 * also reads, so the page and the invoice cannot drift apart.
 *
 * A client-supplied price is never trusted: the browser sends only the plan and
 * level, and the amount is resolved here.
 */
class RateCard
{
    public const PLAN_ONE_TO_ONE = 'One-to-One';
    public const PLAN_GROUP      = 'Group';
    public const LEVELS          = ['Beginner', 'Intermediate', 'Advanced'];

    /**
     * Long catalogue titles that price as their base subject. Mirrors
     * RATE_ALIASES in resources/js/data/courseDetail.js — the two lists must
     * agree or a course would be quoted one way and billed another.
     */
    private const ALIASES = [
        'customizedonlineguitarlessonsforkidsbasicstomastery' => 'Guitar',
        'onlinepianokeyboardclassesforkidsandbeginners'       => 'Piano',
        'pythonprogrammingforkidscodeyourfirstprojects'       => 'Python',
        'pythonprogrammingforbeginners'                       => 'Python',
        'artificialintelligencemachinelearning'               => 'AI & ML',
        'roboticscomputationalthinking'                       => 'Robotics',
        'chessstrategymindsports'                             => 'Chess',
        'violinviolalessonsforbeginners'                      => 'Violin',
    ];

    private static ?array $data = null;

    private static function data(): array
    {
        if (self::$data !== null) return self::$data;

        $path = base_path('database/data/rates.json');
        $json = is_file($path) ? json_decode((string) file_get_contents($path), true) : null;

        return self::$data = is_array($json) ? $json : ['rates' => []];
    }

    private static function norm(?string $s): string
    {
        return preg_replace('~[^a-z0-9]+~', '', strtolower((string) $s));
    }

    /** The rate row for a course name, or null when the sheet does not list it. */
    public static function rowFor(?string $courseName): ?array
    {
        if (!$courseName) return null;

        $key = self::norm(self::ALIASES[self::norm($courseName)] ?? $courseName);

        foreach (self::data()['rates'] ?? [] as $row) {
            if (self::norm($row['name'] ?? null) === $key) return $row;
        }
        return null;
    }

    /**
     * The per-class price for a plan and level, or null when the sheet has no
     * rate for that combination (e.g. Group for a one-to-one-only subject).
     * Falling back is the caller's decision, not this class's.
     */
    public static function price(?string $courseName, ?string $plan, ?string $level): ?float
    {
        $row = self::rowFor($courseName);
        if (!$row) return null;

        $list = $plan === self::PLAN_GROUP ? ($row['inrG'] ?? null) : ($row['inr'] ?? null);
        if (!is_array($list) || !$list) return null;

        $i = array_search($level, self::LEVELS, true);
        if ($i === false) $i = 0;

        // Shorter lists mean "the same rate at every level above this one",
        // which is how the sheet expresses flat-priced subjects.
        return (float) $list[min($i, count($list) - 1)];
    }

    public static function isValidPlan(?string $plan): bool
    {
        return in_array($plan, [self::PLAN_ONE_TO_ONE, self::PLAN_GROUP], true);
    }

    public static function isValidLevel(?string $level): bool
    {
        return in_array($level, self::LEVELS, true);
    }
}
