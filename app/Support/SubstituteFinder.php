<?php

namespace App\Support;

use App\Models\ClassAbsence;
use App\Models\Enrollment;
use App\Models\EnrollmentSchedule;
use App\Models\Tutor;
use Illuminate\Support\Carbon;

/**
 * Who can cover one class the assigned teacher cannot take (E2).
 *
 * The owner's rule is "based on the demands and teacher available", and the
 * automation mandate is that this should resolve itself — a coordinator should
 * be the exception, not the routing layer. So this returns a RANKED list and
 * the caller takes the top one; the same list is shown to staff when it comes
 * up empty, so an override is an informed choice rather than a fresh search.
 *
 * A candidate must clear three gates, in this order, because each is cheaper
 * than the last:
 *
 *   1. CAN they teach it   — published, not the original teacher, and their
 *                            subjects overlap the enrolment's course/subject.
 *   2. Are they FREE then  — the hour sits inside their declared weekly
 *                            availability, and they are not already teaching
 *                            another enrolment at that time, and they have not
 *                            themselves called in absent that day.
 *   3. Are they GOOD       — TeacherPerformance breaks the tie.
 *
 * Gate 2 is the one that makes this trustworthy. Offering a substitute who is
 * already teaching somebody else at 4pm on Tuesday is worse than offering
 * nobody: it looks like an answer and produces a no-show.
 */
class SubstituteFinder
{
    /**
     * @return array<int, array{tutor: Tutor, why: string[], score: float}> best first
     */
    public static function candidatesFor(ClassAbsence $absence, int $limit = 5): array
    {
        $enrollment = $absence->enrollment()->with(['course:id,name', 'tutor:id,name,city,subjects'])->first();
        if (! $enrollment) {
            return [];
        }

        $date    = Carbon::parse($absence->occurs_on);
        $weekday = $date->dayOfWeekIso;
        $time    = substr((string) ($absence->start_time ?? '00:00:00'), 0, 5);

        // What the class is about. The enrolment's course name is the best
        // signal; a plan name ("Starter") says nothing about subject.
        //
        // Falling back to the ORIGINAL TEACHER's subjects matters more than it
        // looks: plenty of enrolments carry no course_id (a demo converted from
        // a free-text subject has none), and with an empty signal every
        // candidate scored equally on subject — so cover was picked on
        // availability alone and a Physics teacher could be sent to a Piano
        // lesson. Who the family was already learning from is a sound proxy for
        // what the class is.
        $subject = $enrollment->course?->name
            ?: (string) ($enrollment->tutor?->subjects ?? '');

        $candidates = Tutor::published()
            ->when($absence->original_tutor_id, fn ($q) => $q->where('id', '!=', $absence->original_tutor_id))
            ->get()
            ->map(function (Tutor $t) use ($subject, $weekday, $time, $date, $enrollment) {
                $why = [];

                if ($subject !== '' && self::teachesSubject($t, $subject)) {
                    $why[] = 'same subject';
                }

                if (! self::freeAt($t, $weekday, $time, $date)) {
                    return null;   // gate 2 — a clash is a disqualification, not a penalty
                }
                $why[] = 'free at that time';

                if ($t->city && $enrollment->tutor?->city && $t->city === $enrollment->tutor->city) {
                    $why[] = 'same city';
                }

                return ['tutor' => $t, 'why' => $why];
            })
            ->filter()
            ->values();

        if ($candidates->isEmpty()) {
            return [];
        }

        // Subject match first — a free Physics teacher is not cover for a Piano
        // class — then track record among those who genuinely fit.
        $perf = TeacherPerformance::forTutors($candidates->pluck('tutor.id')->all());

        return $candidates
            ->map(fn ($c) => $c + ['score' => (float) ($perf[$c['tutor']->id]['score'] ?? 0)])
            ->sortBy([
                fn ($a, $b) => (int) in_array('same subject', $b['why'], true)
                           <=> (int) in_array('same subject', $a['why'], true),
                fn ($a, $b) => $b['score'] <=> $a['score'],
            ])
            ->take($limit)
            ->values()
            ->all();
    }

    private static function teachesSubject(Tutor $tutor, string $subject): bool
    {
        $haystack = mb_strtolower((string) $tutor->subjects);
        foreach (preg_split('/[,\/&+]|\band\b/i', mb_strtolower($subject)) as $token) {
            $token = trim($token);
            $token = $token === 'maths' ? 'math' : $token;
            if (mb_strlen($token) >= 3 && str_contains($haystack, $token)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Free at this weekday and time on this date.
     *
     * Three separate ways to be busy, and all of them matter:
     *   - outside their declared weekly availability (if they declared any);
     *   - already teaching another enrolment in that slot;
     *   - they themselves reported an absence that day.
     *
     * A teacher who has declared NO availability is treated as available. The
     * alternative — excluding them — would empty the candidate list for every
     * online-only teacher, since structured slots are captured on the
     * home-tuition intake and most directory tutors have none.
     */
    private static function freeAt(Tutor $tutor, int $weekday, string $time, Carbon $date): bool
    {
        $profile = $tutor->user_id
            ? \App\Models\PhysicalTeachingProfile::with('slots')
                ->where('user_id', $tutor->user_id)->where('status', 'active')->first()
            : null;

        if ($profile) {
            // On a break, or not started yet — the same rule the public
            // profile applies, so we never propose someone the site is
            // simultaneously telling parents is away.
            $today = now()->startOfDay();
            if ($profile->on_break_until && $profile->on_break_until->gte($today)) return false;
            if ($profile->available_from && $profile->available_from->gt($today)) return false;

            if ($profile->slots->isNotEmpty()) {
                $covers = $profile->slots->contains(fn ($s) =>
                    (int) $s->weekday === $weekday
                    && substr((string) $s->start_time, 0, 5) <= $time
                    && substr((string) $s->end_time, 0, 5)   >  $time
                );
                if (! $covers) return false;
            }
        }

        // Already teaching someone else in this slot.
        $clash = EnrollmentSchedule::query()
            ->active()
            ->where('weekday', $weekday)
            ->whereRaw('substr(start_time, 1, 5) = ?', [$time])
            ->whereHas('enrollment', fn ($q) => $q->where('tutor_id', $tutor->id)->where('status', 'active'))
            ->exists();
        if ($clash) return false;

        // Called in absent on this date themselves.
        $ownAbsence = ClassAbsence::query()
            ->whereDate('occurs_on', $date->toDateString())
            ->where('original_tutor_id', $tutor->id)
            ->whereIn('status', ['requested', 'covered', 'online', 'uncovered'])
            ->exists();

        return ! $ownAbsence;
    }
}
