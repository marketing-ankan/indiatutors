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
 *
 * THE RULE THIS FILE EXISTS TO GET RIGHT
 *
 * A suggestion is a claim, rendered to families as "teaches this subject". So
 * the bar is not "shares a word with the enquiry", it is "actually teaches it",
 * and where the two disagree the honest answer is an empty list — which both
 * callers now render as a sentence rather than a blank space.
 *
 * Two earlier attempts got this wrong in instructive ways, and the rules below
 * are shaped by those failures rather than by theory:
 *
 *   - Any signal that is not evidence of subject fit must be unable to qualify
 *     a tutor ON ITS OWN. A grade point did it once ("teaches Class 9" says
 *     nothing about Maths) and a home-visits point did it before that.
 *   - Any single WORD of a multi-word enquiry must not qualify either.
 *     "Science Grade 1-7" shares "science" with "Computer Science", so a
 *     school-science enquiry for a ten-year-old returned two programmers,
 *     badged as teaching it.
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
        $wants    = self::wanted($subject);

        $rows = $tutors->map(function (Tutor $t) use ($wants, $gradeNum, $wantsHome, $cityKey) {
            $mode = $t->teaching_mode ?: 'online';
            if ($wantsHome && ! in_array($mode, ['home', 'both'], true)) {
                return null;   // cannot visit a home, whatever else fits
            }
            // ...and the mirror case: a family asking for ONLINE classes was
            // being offered home-only tutors who cannot teach them at all.
            if (! $wantsHome && $mode === 'home') {
                return null;
            }

            $why   = [];
            $score = 0;

            // Something must positively justify suggesting this person. Grade
            // and mode are not that; they qualify nobody by themselves.
            $qualified = false;

            if ($wants->isNotEmpty()) {
                $offers = self::offered($t->subjects);
                $fit    = self::subjectFit($wants, $offers);

                // A named subject is a REQUIREMENT, not a bonus. Asked for
                // something we cannot teach, the answer is nobody.
                if ($fit === 0) return null;

                $qualified = true;
                $score    += $fit;
                $why[]     = 'subject';
            }

            if ($wantsHome) {
                // The chip is worth showing; the point is not. Awarding one
                // here meant every home-visiting tutor cleared the gate for a
                // Piano enquiry they teach nothing relevant to.
                $why[] = 'home-visits';

                if ($cityKey !== '' && mb_strtolower((string) $t->city) === $cityKey) {
                    // This one DOES qualify, and is the reason a home enquiry
                    // with a city but no subject still returns somebody: "visits
                    // homes in your city" is a true and useful thing to say, and
                    // the chips say exactly that rather than claiming a subject.
                    $qualified = true;
                    $score    += 2;
                    $why[]     = 'same-city';
                }
            }

            if ($gradeNum !== null && $t->grades) {
                foreach (preg_split('/[,\s]+/', (string) $t->grades, -1, PREG_SPLIT_NO_EMPTY) as $g) {
                    $hit = preg_match('/^(\d{1,2})\s*-\s*(\d{1,2})$/', $g, $r)
                        ? ($gradeNum >= (int) $r[1] && $gradeNum <= (int) $r[2])
                        : (ctype_digit($g) && (int) $g === $gradeNum);
                    if ($hit) {
                        $score += 1;      // deliberately cannot qualify alone
                        $why[]  = 'grade';
                        break;
                    }
                }
            }

            return $qualified ? ['tutor' => $t, 'score' => $score, 'why' => $why] : null;
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
     * "Classical Vocals" quietly makes a singing teacher a maths result.
     */
    private const NOISE = [
        'class', 'classes', 'grade', 'std', 'standard', 'level', 'year',
        'tuition', 'tutor', 'tutors', 'teacher', 'teachers', 'lesson', 'lessons',
        'online', 'home', 'for', 'the', 'and', 'my', 'kid', 'kids', 'child',
        'son', 'daughter', 'need', 'want', 'help', 'course', 'classhelp',
    ];

    /**
     * One spelling for things that are the same subject under two names.
     *
     * Applied to BOTH sides. Doing it only to the enquiry — which is what the
     * previous version did — meant a tutor who writes "Maths" was invisible to
     * every one of the site's five "Mathematics …" courses, which is the exact
     * mismatch this was added to prevent.
     */
    private static function canon(string $s): string
    {
        $s = mb_strtolower(trim($s));
        $s = preg_replace('/\s+/', ' ', $s);

        return preg_replace('/\bmaths?\b|\bmathematics\b|\bmathematic\b/u', 'math', $s);
    }

    /**
     * What the enquiry is asking for, as a list of ALTERNATIVES.
     *
     * A comma, a slash or an ampersand separates different subjects; a space
     * binds one compound subject. That distinction is what separates "AI & ML"
     * — two names, either of which is the whole request — from "Western Flute",
     * where "western" alone is a qualifier and matching only it is how a flute
     * enquiry came back with a vocal teacher.
     *
     * @return Collection<array{phrase: string, words: string[]}>
     */
    private static function wanted(?string $subject): Collection
    {
        $raw = self::canon((string) $subject);
        if ($raw === '') return collect();

        return collect(preg_split('/[,\/&]+|\band\b/u', $raw, -1, PREG_SPLIT_NO_EMPTY))
            ->map(function (string $alt) {
                $alt   = trim(preg_replace('/\s+/', ' ', $alt));
                $words = collect(preg_split('/[^a-z0-9+#]+/u', $alt, -1, PREG_SPLIT_NO_EMPTY))
                    ->reject(fn ($w) => in_array($w, self::NOISE, true))
                    ->reject(fn ($w) => ctype_digit($w))      // the "10" in "Class 10 Math"
                    ->values();

                // The phrase minus its noise words, so "Class 10 Math" is
                // compared as "math" rather than never matching anything.
                return ['phrase' => $words->implode(' '), 'words' => $words->all()];
            })
            ->reject(fn ($a) => $a['phrase'] === '')
            ->values();
    }

    /**
     * A tutor's subjects, one canonical entry each.
     *
     * Split on the same separators as the enquiry, ampersand included. A tutor
     * writes "AI & Machine Learning" meaning two things they teach, exactly as
     * a parent typing it means two things they might want — and splitting only
     * the enquiry side left a request for "Machine Learning" unable to find the
     * person who teaches it, because their entry merely CONTAINED the phrase
     * rather than leading with it.
     */
    private static function offered(?string $subjects): array
    {
        return collect(preg_split('/[,;\/&]+|\band\b/u', (string) $subjects, -1, PREG_SPLIT_NO_EMPTY))
            ->map(fn ($s) => self::canon($s))
            ->reject(fn ($s) => $s === '')
            ->values()
            ->all();
    }

    /**
     * Does this tutor teach any of the things asked for, and how squarely?
     *
     * 0 means no — and 0 is a perfectly good answer that both callers now say
     * out loud rather than rendering as a blank.
     */
    private static function subjectFit(Collection $wants, array $offers): int
    {
        $best = 0;

        foreach ($wants as $want) {
            // The whole request is one of their subjects. Strongest signal
            // there is, and it is what makes an exact course name beat a
            // one-word overlap: "Vocal Music" outranks "Music Theory".
            if (self::leads($offers, $want['phrase'])) {
                $best = max($best, 4);
                continue;
            }

            $hits = 0;
            foreach ($want['words'] as $w) {
                if (self::leads($offers, $w)) $hits++;
            }

            // One word is enough only when one word is all that was asked for.
            // Beyond that a single lead is an overlap rather than a match:
            // "Western Flute" shares "western" with "Western Vocals" and shares
            // nothing that matters. Extra coverage raises the score, so the
            // teacher who matches most of the request is ranked first.
            $needed = count($want['words']) === 1 ? 1 : 2;
            if ($hits >= $needed) {
                $best = max($best, 2 + $hits);
                continue;
            }

            // ...unless one word is EXACTLY something they teach. "Carnatic
            // Violin" is a violin request, and a tutor whose subject list says
            // "Violin" teaches violin — the qualifier being unmet makes them an
            // imperfect answer, not a wrong one. The exactness is what carries
            // it: leading would let "music" reach "Music Theory" and put a
            // piano teacher back in front of a vocals enquiry, which is the
            // thing this whole rule exists to stop.
            //
            // It is also what rescues the long marketing-style course names —
            // "Customized Online Guitar Lessons for Kids — Basics to Mastery"
            // matches only on "guitar", and the guitar teacher is plainly the
            // right answer to it.
            foreach ($want['words'] as $w) {
                if (in_array($w, $offers, true)) { $best = max($best, 3); break; }
            }
        }

        return $best;
    }

    /**
     * Does one of these subjects LEAD with this token?
     *
     * Leading, not containing. "Science" must not find "Computer Science" —
     * a compound subject is a different subject from its head noun, and
     * treating them as equal is what put programmers in front of a parent
     * looking for school science. "Python" finding "Python Programming" is the
     * same rule working the way round that is wanted.
     *
     * Plain string comparison rather than a regex, so a token ending in
     * punctuation behaves: "C++" could never match anything under \b, because
     * there is no word boundary after a plus sign.
     */
    private static function leads(array $offers, string $token): bool
    {
        if ($token === '') return false;
        $len = strlen($token);

        foreach ($offers as $offer) {
            if ($offer === $token) return true;

            // A prefix only counts up to a boundary: "java" leads "java script"
            // but must not reach "javascript", which is a different subject.
            if (str_starts_with($offer, $token)) {
                $next = $offer[$len] ?? '';
                if ($next !== '' && ! ctype_alnum($next)) return true;
            }
        }

        return false;
    }
}
