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
                // The phrase is the first token, so an exact multi-word hit is
                // distinguishable from a single-word one and can be scored
                // higher. Without that, "Vocal Music" ranked the actual vocal
                // teacher THIRD, behind two people who merely list "Music
                // Theory" — both are legitimate results, but only one of them
                // is what was asked for.
                $phraseHit = self::subjectHit($subjects, $tokens->first());
                if (! $phraseHit && ! $tokens->first(fn ($tok) => self::subjectHit($subjects, $tok))) {
                    // A named subject is a REQUIREMENT, not a bonus.
                    //
                    // Without this the grade point below could qualify a tutor
                    // on its own, and "teaches Class 9" says nothing about
                    // whether they teach Maths: an enquiry for Class 9
                    // Mathematics was returning a Yoga teacher, an English
                    // teacher and a drummer, because no tutor on the site
                    // teaches Maths and those three happen to cover Class 9.
                    // On the booking form — the highest-intent page there is —
                    // an irrelevant suggestion is worse than none, and it
                    // quietly tells the family we have nobody who understands
                    // what they asked for.
                    //
                    // Same disease as the home-visits chip below, one branch
                    // over: any signal that is not evidence of fit must not be
                    // able to clear the score gate by itself.
                    return null;
                }
                $score += $phraseHit ? 4 : 3;
                $why[]  = 'subject';
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
     * Words that describe the ENQUIRY rather than the subject.
     *
     * "Class 10 Math" must not match on "class", or a token that is a prefix of
     * "Classical Vocals" quietly makes a singing teacher a maths result. These
     * carry no subject meaning, so dropping them costs nothing and removes a
     * whole family of false positives.
     */
    private const NOISE = [
        'class', 'classes', 'grade', 'std', 'standard', 'level', 'year',
        'tuition', 'tutor', 'tutors', 'teacher', 'teachers', 'lesson', 'lessons',
        'online', 'home', 'for', 'the', 'and', 'my', 'kid', 'kids', 'child',
        'son', 'daughter', 'need', 'want', 'help', 'course', 'classhelp',
    ];

    /**
     * What an enquiry is actually asking for.
     *
     * Returns the whole normalised phrase AND its individual words, because the
     * two catch different real inputs and neither is sufficient alone:
     *
     *   "Python Programming"  the phrase matches a tutor's "Python Programming"
     *   "Class 10 Math"       only the WORD "math" can reach "Mathematics"
     *   "AI & ML"             only the words survive; both are under 3 letters
     *
     * The previous version split on punctuation but never on whitespace, so a
     * multi-word enquiry became one token that had to appear verbatim in the
     * tutor's subject string. That made the booking form's own placeholder
     * ("e.g. Class 10 Math") match nothing, and it made "AI & ML" tokenise to
     * NOTHING at all — which was the dangerous case, because an empty token set
     * skipped the subject requirement entirely and let any tutor through on the
     * grade point alone. The phrase token below can never be empty for a
     * non-empty subject, so that bypass cannot reopen.
     */
    private static function tokens(?string $subject): Collection
    {
        $raw = mb_strtolower(trim((string) $subject));
        if ($raw === '') return collect();

        $phrase = trim(preg_replace('/\s+/', ' ', $raw));

        $words = collect(preg_split('/[^a-z0-9+#]+/u', $phrase, -1, PREG_SPLIT_NO_EMPTY))
            ->map(fn ($w) => $w === 'maths' ? 'math' : $w)
            ->reject(fn ($w) => in_array($w, self::NOISE, true))
            ->reject(fn ($w) => ctype_digit($w))          // "10" in "Class 10 Math"
            ->reject(fn ($w) => mb_strlen($w) < 2)
            ->unique();

        // Phrase first: an exact multi-word hit is the strongest signal, and
        // keeping it guarantees a non-empty set for any non-empty subject.
        return collect([$phrase])->concat($words)->unique()->values();
    }

    /**
     * Does this tutor's subject list answer that token?
     *
     * Anchored at a word boundary rather than a bare substring, so "art" cannot
     * match "Bharatnatyam". A token of four or more characters may match a
     * PREFIX, which is what lets "math" find "Mathematics" and "program" find
     * "Programming"; anything shorter must be a whole word, so "ai" matches
     * "AI & ML" without also matching "Trained".
     */
    private static function subjectHit(string $subjects, string $token): bool
    {
        $t = preg_quote($token, '/');

        return mb_strlen($token) >= 4
            ? (bool) preg_match('/\b' . $t . '/u', $subjects)
            : (bool) preg_match('/\b' . $t . '\b/u', $subjects);
    }
}
