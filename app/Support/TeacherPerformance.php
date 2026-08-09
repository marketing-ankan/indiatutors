<?php

namespace App\Support;

use App\Models\DemoRequest;
use App\Models\Review;
use App\Models\Tutor;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

/**
 * The two signals the founder's system page ranks teachers on, and the single
 * rule about who may leave one.
 *
 * They are deliberately different in kind:
 *
 *   REVIEWS      what families SAY   — subjective, self-selecting, gameable
 *                                      unless gated
 *   CONVERSION   what families DO    — objective, but meaningless on small
 *                                      numbers (see the caveat below)
 *
 * Kept together in one class because they share a definition that must never
 * diverge: **which demos count**. Both are measured only over demos that
 * provably took place (DemoRequest::HELD / completed_at, from Stage 1). Count
 * the same set two different ways and the ranking becomes indefensible the
 * first time a teacher asks how their number was produced.
 */
class TeacherPerformance
{
    /**
     * Who a demo is credited to, in SQL. Mirrors DemoRequest::creditedTutorId()
     * exactly — assigned wins, then the teacher the family chose. The two MUST
     * agree: this expression decides the conversion rate, that method decides
     * who may be reviewed, and a teacher scored on one basis and reviewed on
     * another is a bug nobody would spot for months.
     */
    public const CREDITED = 'COALESCE(assigned_tutor_id, requested_tutor_id)';

    /**
     * Can this user review this demo, and if not, why not?
     *
     * Returns null when allowed; otherwise a sentence fit to show the user.
     * A single method rather than scattered checks, because the API and the UI
     * must give the same answer — the profile page asks it to decide whether
     * to render the form at all, and the controller asks it again to decide
     * whether to accept the POST.
     */
    public static function reviewBlockedReason(?int $userId, ?DemoRequest $demo, int $tutorId): ?string
    {
        if ($userId === null) {
            return 'Please sign in to review a teacher you have had a demo with.';
        }
        if ($demo === null) {
            return 'Only families who have had a demo class with this teacher can review them.';
        }
        if ($demo->user_id !== $userId) {
            return 'This demo belongs to another account.';
        }
        if ($demo->creditedTutorId() !== $tutorId) {
            return 'That demo was not with this teacher.';
        }
        // The Stage 1 gate. completed_at is the load-bearing fact: a booking
        // that was made and never held proves nothing about the teacher.
        if (! in_array($demo->status, DemoRequest::HELD, true) || $demo->completed_at === null) {
            return 'You can review this teacher once your demo class has taken place.';
        }
        if (Review::where('demo_request_id', $demo->id)->exists()) {
            return 'You have already reviewed this demo class.';
        }
        return null;
    }

    /**
     * The most recent demo this user had with this teacher that is reviewable.
     * `whereDoesntHave` rather than a NOT IN subquery so an already-reviewed
     * demo is skipped in favour of an older un-reviewed one — a family that
     * took two demos with the same teacher may review both.
     */
    public static function reviewableDemo(?int $userId, int $tutorId): ?DemoRequest
    {
        if ($userId === null) {
            return null;
        }
        return DemoRequest::query()
            ->where('user_id', $userId)
            ->held()
            ->whereNotNull('completed_at')
            ->whereRaw(self::CREDITED . ' = ?', [$tutorId])
            ->whereDoesntHave('review')
            ->latest('completed_at')
            ->first();
    }

    /**
     * Why this user cannot review this teacher, in their own situation's terms.
     *
     * reviewableDemo() returns null for three quite different reasons — no demo
     * at all, a demo not yet held, or one already reviewed — so explaining the
     * block from its null result told a parent who had just written a review
     * that they had never had a demo. This looks up their most recent demo with
     * the teacher REGARDLESS of review state, so reviewBlockedReason lands on
     * the branch that actually applies.
     */
    public static function explainBlock(?int $userId, int $tutorId): ?string
    {
        if ($userId === null) {
            return self::reviewBlockedReason(null, null, $tutorId);
        }
        $demo = DemoRequest::query()
            ->where('user_id', $userId)
            ->whereRaw(self::CREDITED . ' = ?', [$tutorId])
            ->orderByRaw('completed_at IS NULL')   // held demos first
            ->latest('completed_at')
            ->latest('id')
            ->first();

        return self::reviewBlockedReason($userId, $demo, $tutorId);
    }

    /**
     * Per-teacher signals. `held` is the denominator — demos that took place —
     * NOT all bookings, which would count leads that never got as far as a
     * class and would punish a teacher for the coordinator's backlog.
     *
     * `rate` is deliberately null below `MIN_DEMOS_FOR_RATE`, rather than 0 or
     * a flattering 100%. One demo converted is not a 100% conversion rate in
     * any sense a person would defend, and a ranking that says so collapses
     * the first time a new teacher tops the list. Whether to smooth toward the
     * platform mean instead of hiding the number is the founder's call (D3a in
     * docs/ECOSYSTEM-PLAN.md) — until then, we say "not enough data" honestly.
     */
    public const MIN_DEMOS_FOR_RATE = 5;

    public static function forTutor(int $tutorId): array
    {
        $demos = DemoRequest::query()->whereRaw(self::CREDITED . ' = ?', [$tutorId]);

        $held      = (int) $demos->clone()->held()->count();
        $converted = (int) $demos->clone()->where('status', 'converted')->count();

        $reviews = Review::approved()->where('tutor_id', $tutorId);
        $count   = (int) $reviews->clone()->count();

        return [
            'demos_held'      => $held,
            'demos_converted' => $converted,
            'conversion_rate' => $held >= self::MIN_DEMOS_FOR_RATE
                ? round($converted / $held * 100)
                : null,
            'rate_pending'    => $held < self::MIN_DEMOS_FOR_RATE,
            'review_count'    => $count,
            'review_avg'      => $count > 0 ? round((float) $reviews->clone()->avg('rating'), 1) : null,
        ];
    }

    /**
     * The same figures for many teachers in three queries instead of 3N.
     * The ranking (Stage 3) will read this over the whole directory, so it
     * must not be a per-row lookup.
     */
    public static function forTutors(array $tutorIds): array
    {
        if (! $tutorIds) {
            return [];
        }
        $ids = array_values(array_unique(array_map('intval', $tutorIds)));
        $in  = implode(',', array_fill(0, count($ids), '?'));
        // Placeholders derived from HELD, not hardcoded: writing `IN (?, ?)`
        // would silently break the moment a third "the demo happened" state is
        // added, and the failure would be a wrong number rather than an error.
        $heldIn = implode(',', array_fill(0, count(DemoRequest::HELD), '?'));

        $demoRows = DB::table('demo_requests')
            ->selectRaw(self::CREDITED . ' as tutor_id')
            ->selectRaw("SUM(CASE WHEN status IN ($heldIn) THEN 1 ELSE 0 END) as held", DemoRequest::HELD)
            ->selectRaw("SUM(CASE WHEN status = 'converted' THEN 1 ELSE 0 END) as converted")
            ->whereRaw(self::CREDITED . " IN ($in)", $ids)
            ->groupByRaw(self::CREDITED)
            ->get()->keyBy('tutor_id');

        $reviewRows = DB::table('reviews')
            ->select('tutor_id')
            ->selectRaw('COUNT(*) as c')
            ->selectRaw('AVG(rating) as avg_rating')
            ->where('status', 'approved')
            ->whereIn('tutor_id', $ids)
            ->groupBy('tutor_id')
            ->get()->keyBy('tutor_id');

        $out = [];
        foreach ($ids as $id) {
            $d = $demoRows->get($id);
            $r = $reviewRows->get($id);
            $held      = (int) ($d->held ?? 0);
            $converted = (int) ($d->converted ?? 0);
            $count     = (int) ($r->c ?? 0);
            $out[$id] = [
                'demos_held'      => $held,
                'demos_converted' => $converted,
                'conversion_rate' => $held >= self::MIN_DEMOS_FOR_RATE ? round($converted / $held * 100) : null,
                'rate_pending'    => $held < self::MIN_DEMOS_FOR_RATE,
                'review_count'    => $count,
                'review_avg'      => $count > 0 ? round((float) $r->avg_rating, 1) : null,
            ];
        }
        return $out;
    }
}
