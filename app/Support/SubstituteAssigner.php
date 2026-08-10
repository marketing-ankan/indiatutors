<?php

namespace App\Support;

use App\Models\AppNotification;
use App\Models\AuditLog;
use App\Models\ClassAbsence;

/**
 * Commits the substitute choice (E2), and is the first place in this codebase
 * that ASSIGNS a teacher rather than suggesting one.
 *
 * That is a deliberate reversal, not an oversight. Until 2026-08-10 the console
 * suggested and never assigned, because the leads software owned the decision.
 * The owner has retired that system and asked for the operation to be automated
 * here, with coordinators intervening by exception. So this picks the top
 * candidate and commits it.
 *
 * Three things make an automatic assignment defensible rather than reckless:
 *   - it is scoped to ONE dated class, never the standing arrangement, so a
 *     wrong pick costs one lesson and self-corrects next week;
 *   - it records `auto_assigned` and an audit row, so "how often does the
 *     system get this right" is answerable rather than assumed;
 *   - an empty candidate list becomes `uncovered` and reaches a human, instead
 *     of silently assigning the least-bad option.
 */
class SubstituteAssigner
{
    /**
     * Find and commit cover. Returns a payload describing what happened.
     */
    public static function resolve(ClassAbsence $absence, bool $auto = true): array
    {
        $candidates = SubstituteFinder::candidatesFor($absence);

        if (! $candidates) {
            $absence->update(['status' => 'uncovered']);
            AuditLog::record('class_absence_uncovered', 'enrollment', $absence->enrollment_id,
                'Class on ' . $absence->occurs_on->toDateString());

            return [
                'status'  => 'uncovered',
                'message' => 'No teacher is free for that slot — a coordinator will arrange cover.',
            ];
        }

        $pick = $candidates[0];

        $absence->update([
            'substitute_tutor_id' => $pick['tutor']->id,
            'status'              => 'covered',
            'auto_assigned'       => $auto,
            'resolved_at'         => now(),
        ]);

        AuditLog::record('class_absence_covered', 'enrollment', $absence->enrollment_id,
            'Class on ' . $absence->occurs_on->toDateString(), [
                'substitute' => $pick['tutor']->name,
                'auto'       => $auto,
                'why'        => $pick['why'],
            ]);

        self::notify($absence, $pick['tutor']);

        return [
            'status'     => 'covered',
            'substitute' => ['id' => $pick['tutor']->id, 'name' => $pick['tutor']->name, 'why' => $pick['why']],
            'message'    => $pick['tutor']->name . ' will cover this class.',
        ];
    }

    /**
     * Tell both sides. The substitute in particular has been given work by a
     * machine and would otherwise find out by being asked where they were.
     */
    private static function notify(ClassAbsence $absence, $substitute): void
    {
        $when = $absence->occurs_on->toFormattedDayDateString()
            . ($absence->start_time ? ' at ' . substr((string) $absence->start_time, 0, 5) : '');

        $familyUserId = $absence->enrollment?->student?->user_id;
        if ($familyUserId) {
            AppNotification::send($familyUserId, 'class_substitute',
                'A substitute teacher for your next class',
                "{$substitute->name} will take the class on {$when}. Your usual teacher returns the following week.");
        }

        if ($substitute->user_id) {
            AppNotification::send($substitute->user_id, 'class_substitute_assigned',
                'You have been asked to cover a class',
                "A class on {$when} has been assigned to you as cover. Please check your portal.");
        }
    }
}
