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

    /**
     * How strongly a teacher with no history is held to the platform average.
     *
     * Owner's decision, 2026-08-10: rank everyone from day one, smoothed toward
     * the mean, rather than parking new teachers at the bottom. The alternative
     * was self-defeating — a teacher ranked last gets no bookings, so never
     * accumulates the demos that would lift them, and the ranking silently
     * freezes the current roster in place.
     *
     * Read these as "worth this many imaginary average demos/reviews". At
     * PRIOR_DEMOS = 5 a teacher's own record outweighs the prior once they pass
     * ten demos, which is roughly when a rate stops being noise.
     */
    public const PRIOR_DEMOS   = 5;
    public const PRIOR_REVIEWS = 3;

    /** Weighting of the two signals in the final score. They measure different
     *  things — what families SAY vs what they DO — so both must count, and
     *  conversion leads because it is the harder one to game. */
    public const W_CONVERSION = 0.6;
    public const W_REVIEWS    = 0.4;

    /** Fallback means for an empty platform, so the very first teacher is not
     *  divided by zero or scored against nothing. */
    private const SEED_RATE   = 0.35;   // 35% of held demos convert
    private const SEED_RATING = 4.0;

    /**
     * How much platform history the mean itself needs before it is trusted.
     *
     * Without this the prior is as noisy as the thing it is meant to steady.
     * Caught in testing: with a single 5★ review on the whole site the "mean
     * rating" was 5.0, so a teacher with NO reviews was smoothed to a perfect
     * score and outranked a 4.6★ veteran with twenty. Same trap on the demo
     * side — three lucky early conversions would set the house average at 100%
     * and flatter every newcomer for months.
     *
     * Below these counts we use the seed constants: a deliberately modest
     * assumption is safer than a confident one drawn from four data points.
     */
    private const MEAN_MIN_DEMOS   = 20;
    private const MEAN_MIN_REVIEWS = 10;

    /**
     * Platform-wide averages, the anchor every teacher is smoothed toward.
     * Two queries, cached per request — the ranking calls this once per list,
     * never per row.
     */
    private static ?array $means = null;

    public static function platformMeans(): array
    {
        if (self::$means !== null) {
            return self::$means;
        }

        // Only demos credited to a teacher. Every per-teacher figure is scoped
        // to CREDITED, so the mean they are shrunk toward must come from the
        // same population — and workshop, group and free-class registrations
        // belong to nobody. Counting them let MEAN_MIN_DEMOS be satisfied with
        // zero teacher history: 25 converted workshop sign-ups would set the
        // house rate to 80% and score every teacher with no record at 78
        // instead of the 51 the seed fallback intends. Mirrors the
        // whereNotNull('tutor_id') already on the rating mean below.
        $demos = DemoRequest::query()->whereRaw(self::CREDITED . ' IS NOT NULL');
        $held  = (int) $demos->clone()->held()->count();
        $conv  = (int) $demos->clone()->where('status', 'converted')->count();

        $ratings = DB::table('reviews')->where('status', 'approved')->whereNotNull('tutor_id');
        $ratingN = (int) $ratings->clone()->count();

        return self::$means = [
            'rate' => $held >= self::MEAN_MIN_DEMOS
                ? $conv / $held
                : self::SEED_RATE,
            'rating' => $ratingN >= self::MEAN_MIN_REVIEWS
                ? (float) $ratings->clone()->avg('rating')
                : self::SEED_RATING,
            // Exposed so the console can say "ranking is still warming up"
            // rather than implying these numbers carry more weight than they do.
            'from_real_data' => $held >= self::MEAN_MIN_DEMOS && $ratingN >= self::MEAN_MIN_REVIEWS,
        ];
    }

    /** Test/seed hook — forget the memoised means. */
    public static function flushMeans(): void { self::$means = null; }

    /**
     * The ranking score, 0–100. Bayesian shrinkage on both signals: a teacher's
     * own numbers are blended with the platform mean in proportion to how much
     * evidence they actually have, so
     *
     *   - one demo converted does NOT read as 100%,
     *   - a veteran at 60% over 50 demos outranks a newcomer at 1-for-1,
     *   - and a brand-new teacher still gets a defensible mid-table score
     *     instead of a zero that would deny them the bookings they need.
     *
     * Deliberately NOT shown to students as a number. It orders a list; it is
     * not a grade out of 100 to publish next to someone's name.
     */
    public static function score(array $p): float
    {
        $m = self::platformMeans();

        $held      = (int) ($p['demos_held'] ?? 0);
        $converted = (int) ($p['demos_converted'] ?? 0);
        $rate = (self::PRIOR_DEMOS * $m['rate'] + $converted) / (self::PRIOR_DEMOS + $held);

        $count = (int) ($p['review_count'] ?? 0);
        // Prefer the exact sum when the caller has it. review_avg is rounded to
        // one decimal for DISPLAY, and reconstructing the total from it can move
        // a teacher's score by enough to flip a tie-break — the ranking must not
        // depend on a rounding artefact.
        $sum = array_key_exists('review_sum', $p)
            ? (float) $p['review_sum']
            : ($count > 0 ? (float) ($p['review_avg'] ?? 0) * $count : 0.0);
        $rating = (self::PRIOR_REVIEWS * $m['rating'] + $sum) / (self::PRIOR_REVIEWS + $count);

        // Ratings are 1–5; normalise to 0–1 across the usable band so a 3★
        // average is not treated as 60% good.
        $ratingNorm = max(0.0, min(1.0, ($rating - 1) / 4));

        return round((self::W_CONVERSION * $rate + self::W_REVIEWS * $ratingNorm) * 100, 2);
    }

    public static function forTutor(int $tutorId): array
    {
        $demos = DemoRequest::query()->whereRaw(self::CREDITED . ' = ?', [$tutorId]);

        $held      = (int) $demos->clone()->held()->count();
        $converted = (int) $demos->clone()->where('status', 'converted')->count();

        $reviews = Review::approved()->where('tutor_id', $tutorId);
        $count   = (int) $reviews->clone()->count();
        $sum     = (float) $reviews->clone()->sum('rating');

        $p = [
            'demos_held'      => $held,
            'demos_converted' => $converted,
            'conversion_rate' => $held >= self::MIN_DEMOS_FOR_RATE
                ? round($converted / $held * 100)
                : null,
            'rate_pending'    => $held < self::MIN_DEMOS_FOR_RATE,
            'review_count'    => $count,
            'review_avg'      => $count > 0 ? round($sum / $count, 1) : null,
        ];
        // Scored on the exact sum, then dropped — it is scoring input, not part
        // of the payload any caller reads.
        $p['score'] = self::score($p + ['review_sum' => $sum]);
        return $p;
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
            ->selectRaw('SUM(rating) as sum_rating')
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
            $sum       = (float) ($r->sum_rating ?? 0);
            $row = [
                'demos_held'      => $held,
                'demos_converted' => $converted,
                'conversion_rate' => $held >= self::MIN_DEMOS_FOR_RATE ? round($converted / $held * 100) : null,
                'rate_pending'    => $held < self::MIN_DEMOS_FOR_RATE,
                'review_count'    => $count,
                'review_avg'      => $count > 0 ? round($sum / $count, 1) : null,
            ];
            // Exact sum, matching forTutor() — the two paths must not disagree.
            $row['score'] = self::score($row + ['review_sum' => $sum]);
            $out[$id] = $row;
        }
        return $out;
    }
}
