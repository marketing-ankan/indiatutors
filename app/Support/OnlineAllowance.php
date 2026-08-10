<?php

namespace App\Support;

use App\Models\ClassAbsence;
use App\Models\Enrollment;
use App\Models\EnrollmentSchedule;
use App\Models\Tutor;
use Illuminate\Support\Carbon;

/**
 * A teacher's 25%-per-month online allowance (E9).
 *
 * The owner's description: a teacher who normally teaches physically may take a
 * class online when they cannot attend in person, capped at 25% of the classes
 * they are required to take — *"something like leaves, but not exactly leaves"*.
 * Counting period confirmed 2026-08-10: **per calendar month**.
 *
 * THE DENOMINATOR IS THE OBLIGATION, NOT THE ATTENDANCE. It is computed from the
 * standing timetable — how many classes this teacher is *supposed* to take this
 * month — rather than from class_logs, which records what actually happened.
 * Using attendance would make the allowance shrink every time it is spent: take
 * a class online, teach one fewer in person, and the 25% ceiling drops with it.
 *
 * Only PHYSICAL obligations count. An online-only teacher has nothing to convert
 * — the allowance is about not travelling — so their quota is zero and the
 * option is never offered, rather than offered and then confusingly refused.
 */
class OnlineAllowance
{
    /** The owner's figure. A share of the month's required classes. */
    public const SHARE = 0.25;

    /**
     * @return array{required:int, used:int, allowed:int, remaining:int, eligible:bool}
     */
    public static function forTutor(int $tutorId, ?Carbon $month = null): array
    {
        $month = ($month ?? now())->copy()->startOfMonth();
        $tutor = Tutor::find($tutorId);

        // "Physical" means they visit homes at all. An online-only teacher has
        // no in-person obligation to be relieved of.
        $eligible = $tutor && in_array($tutor->teaching_mode ?: 'online', ['home', 'both'], true);

        $required = $eligible ? self::requiredThisMonth($tutorId, $month) : 0;
        // Ceil, so a teacher with a small timetable still gets one class rather
        // than an allowance that rounds to nothing.
        $allowed  = $required > 0 ? (int) ceil($required * self::SHARE) : 0;

        $used = ClassAbsence::query()
            ->where('original_tutor_id', $tutorId)
            ->where('status', 'online')
            ->whereBetween('occurs_on', [$month->toDateString(), $month->copy()->endOfMonth()->toDateString()])
            ->count();

        return [
            'required'  => $required,
            'used'      => $used,
            'allowed'   => $allowed,
            'remaining' => max(0, $allowed - $used),
            'eligible'  => $eligible,
        ];
    }

    /**
     * How many classes the standing timetable requires of this teacher in the
     * given month: for each active weekly slot, the number of times that
     * weekday falls in the month.
     */
    private static function requiredThisMonth(int $tutorId, Carbon $month): int
    {
        $slots = EnrollmentSchedule::query()
            ->active()
            ->whereHas('enrollment', fn ($q) => $q->where('tutor_id', $tutorId)->where('status', 'active'))
            ->get(['weekday']);

        if ($slots->isEmpty()) {
            return 0;
        }

        // Count each ISO weekday's occurrences once, then multiply by how many
        // slots sit on that day — a teacher with two Tuesday classes owes two
        // per Tuesday.
        $perWeekday = $slots->groupBy('weekday')->map->count();

        $total = 0;
        $cursor = $month->copy()->startOfMonth();
        $end    = $month->copy()->endOfMonth();
        while ($cursor->lte($end)) {
            $total += (int) ($perWeekday[$cursor->dayOfWeekIso] ?? 0);
            $cursor->addDay();
        }

        return $total;
    }
}
