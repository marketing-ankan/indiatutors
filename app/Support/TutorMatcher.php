<?php

namespace App\Support;

use App\Models\Tutor;
use Illuminate\Support\Collection;

/**
 * Which directory tutors fit an enquiry, best first.
 *
 * Extracted from AdminController::demoSuggestions when the same shortlist had
 * to appear to families during booking. One implementation on purpose: if the
 * parent's list and the coordinator's list were scored by two copies of this
 * logic, they would drift, and the first time they disagreed nobody would be
 * able to say which was right. The two callers differ only in what they are
 * allowed to SEE — staff get conversion figures, families do not.
 *
 * Sibling of TeacherMatcher, which does the same job for home-tuition
 * PhysicalTeachingProfiles using real distance. This one covers the online
 * directory, where the only location signal is a city name.
 *
 * FIT is not the same as RANK. `score` here answers "does this teacher match
 * what was asked for" — subject, grade, mode, city. TeacherPerformance::score
 * answers "how well does this teacher do". Fit leads, because a superb Physics
 * teacher is the wrong answer to a Piano enquiry; track record only breaks ties
 * among teachers who genuinely fit.
 */
class TutorMatcher
{
    /**
     * @param  Collection<Tutor>  $tutors  already filtered to published
     * @return Collection<array{tutor: Tutor, score: int, why: string[]}>
     */
    public static function rank(
        Collection $tutors,
        ?string $subject,
        ?string $grade,
        ?string $city,
        bool $wantsHome,
    ): Collection {
        $cityKey  = mb_strtolower(trim((string) $city));
        $gradeNum = preg_match('/(\d{1,2})/', (string) $grade, $m) ? (int) $m[1] : null;
        $tokens   = self::tokens($subject);

        $rows = $tutors->map(function (Tutor $t) use ($tokens, $gradeNum, $wantsHome, $cityKey) {
            $mode = $t->teaching_mode ?: 'online';
            if ($wantsHome && ! in_array($mode, ['home', 'both'], true)) {
                return null;   // cannot visit a home, whatever else fits
            }
            // ...and the mirror case, which was missing: a family asking for
            // ONLINE classes was being offered home-only tutors who cannot
            // teach them at all.
            if (! $wantsHome && $mode === 'home') {
                return null;
            }

            $why   = [];
            $score = 0;

            if ($tokens->isNotEmpty()) {
                $subjects = mb_strtolower((string) $t->subjects);
                if ($tokens->first(fn ($tok) => str_contains($subjects, $tok))) {
                    $score += 3;
                    $why[]  = 'subject';
                }
            }

            if ($gradeNum !== null && $t->grades) {
                foreach (preg_split('/[,\s]+/', (string) $t->grades, -1, PREG_SPLIT_NO_EMPTY) as $g) {
                    $hit = preg_match('/^(\d{1,2})\s*-\s*(\d{1,2})$/', $g, $r)
                        ? ($gradeNum >= (int) $r[1] && $gradeNum <= (int) $r[2])
                        : (ctype_digit($g) && (int) $g === $gradeNum);
                    if ($hit) {
                        $score += 1;
                        $why[]  = 'grade';
                        break;
                    }
                }
            }

            if ($wantsHome) {
                // Scores NOTHING on its own. Being able to visit homes is the
                // filter applied above, not a reason to prefer one teacher over
                // another — awarding +1 here meant every home-visiting tutor on
                // the site cleared the `score > 0` gate and got suggested for a
                // Piano enquiry they teach nothing relevant to. The chip stays,
                // because it is still worth telling the family why they qualify.
                $why[] = 'home-visits';
                if ($cityKey !== '' && mb_strtolower((string) $t->city) === $cityKey) {
                    $score += 2;
                    $why[]  = 'same-city';
                }
            }

            return $score > 0 ? ['tutor' => $t, 'score' => $score, 'why' => $why] : null;
        })->filter();

        // Track record breaks ties among equally-fitting teachers — it never
        // promotes a teacher who does not fit the enquiry in the first place.
        $perf = TeacherPerformance::forTutors($rows->pluck('tutor.id')->all());

        return $rows->sortBy([
            fn ($a, $b) => $b['score'] <=> $a['score'],
            fn ($a, $b) => ($perf[$b['tutor']->id]['score'] ?? 0) <=> ($perf[$a['tutor']->id]['score'] ?? 0),
            fn ($a, $b) => ((int) $b['tutor']->experience_years) <=> ((int) $a['tutor']->experience_years),
            fn ($a, $b) => $a['tutor']->position <=> $b['tutor']->position,
        ])->values();
    }

    /**
     * "Maths & Science" / "Physics, Chemistry" → ['math','science',…].
     * Tokens under 3 chars are noise ("ap", "&"), and 'maths' must become
     * 'math' or it never substring-matches a tutor row's "Mathematics".
     */
    private static function tokens(?string $subject): Collection
    {
        return collect(preg_split('/[,\/&+]|\band\b/i', mb_strtolower(trim((string) $subject))))
            ->map(fn ($t) => trim($t))
            ->map(fn ($t) => $t === 'maths' ? 'math' : $t)
            ->filter(fn ($t) => mb_strlen($t) >= 3)
            ->values();
    }
}
