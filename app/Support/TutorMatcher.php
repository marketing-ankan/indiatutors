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
 * what was asked for". TeacherPerformance::score answers "how well does this
 * teacher do". Fit leads, because a superb Physics teacher is the wrong answer
 * to a Piano enquiry; track record only breaks ties among teachers who fit.
 *
 * THE RULE THIS FILE EXISTS TO GET RIGHT
 *
 * A suggestion is a claim, rendered to families as "teaches this subject". The
 * bar is therefore "actually teaches it", not "shares a word with it", and
 * where those disagree the honest answer is an empty list — which both callers
 * render as a sentence rather than a blank space.
 *
 * Three rounds of review shaped the rules below, each catching the previous
 * round's fix being wrong in a way its own tests could not see. Worth stating
 * plainly, because every one of them is a mistake that looks reasonable:
 *
 *   1. Nothing that is not evidence of subject fit may qualify a tutor ALONE.
 *      A grade point did it ("teaches Class 9" says nothing about Maths); the
 *      home-visits point did it before that.
 *   2. One WORD of a multi-word request is not a match. "Science Grade 1-7"
 *      shares "science" with "Computer Science", and a ten-year-old's science
 *      enquiry came back with two programmers badged as teaching it.
 *   3. Matching must be SYMMETRIC and normalisation IDENTICAL on both sides.
 *      Fixing (2) by requiring the tutor's wording to lead the enquiry's meant
 *      an enquiry more specific than the tutor's own words matched nobody:
 *      "Python Programming for Beginners" — a featured course — found neither
 *      of the two people who list "Python Programming", and a tutor whose
 *      subject was byte-identical to the course name scored zero because one
 *      side stripped the apostrophe from "Rubik's Cube" and the other did not.
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

        $named = self::canon((string) $subject) !== '';
        $wants = self::wanted($subject);

        // The family named something, and none of it survived as a subject —
        // "Class 10" is all stopword and digit. That is NOT the same as naming
        // nothing, and treating it as such let a home enquiry fall through to
        // the city branch and return the entire roster, yoga teacher included.
        // Asked for something we cannot read, the honest answer is nobody.
        if ($named && $wants->isEmpty()) return collect();

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
                $fit = self::subjectFit($wants, self::offered($t->subjects));

                // A named subject is a REQUIREMENT, not a bonus.
                if ($fit['score'] === 0) return null;

                $qualified = true;
                $score    += $fit['score'];

                // A partial match says what it actually is. The chip used to
                // read "teaches this subject" for a tutor listing bare "Dance"
                // against a Kathak enquiry, which is a claim she never made;
                // it now reads "teaches Dance", which is true and lets a family
                // judge for themselves. Both callers render an unknown `why`
                // token verbatim, so this needs no change at either end.
                $why[] = $fit['kind'] === 'partial'
                    ? 'teaches ' . ucwords($fit['item'])
                    : 'subject';
            }

            if ($wantsHome) {
                // The chip is worth showing; the point is not. Awarding one
                // here meant every home-visiting tutor cleared the gate for a
                // Piano enquiry they teach nothing relevant to.
                $why[] = 'home-visits';

                if ($cityKey !== '' && mb_strtolower((string) $t->city) === $cityKey) {
                    // This one DOES qualify, and is why a home enquiry with a
                    // city but no subject still returns somebody: "visits homes
                    // in your city" is true and useful, and the chips say
                    // exactly that rather than claiming a subject.
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
        // What KIND of teaching, not what subject. "IELTS coaching" found
        // nobody while "IELTS Training" found the IELTS trainer, because the
        // two differ only in a word that names the format. Stripping these
        // leaves the subject itself, which is the part a tutor lists.
        //
        // Only ever stripped from the ENQUIRY. A tutor's own "IELTS Training"
        // keeps both words, so it is still what gets matched against.
        // "learning" is deliberately absent — it would gut "Machine Learning".
        'coaching', 'training', 'preparation', 'prep', 'practice', 'bootcamp',
        'beginner', 'beginners', 'basics', 'intermediate', 'advanced', 'crash',
    ];

    /**
     * One spelling for things that are the same subject under two names.
     *
     * Applied to BOTH sides. Doing it only to the enquiry meant a tutor who
     * writes "Maths" was invisible to every one of the site's five
     * "Mathematics …" courses.
     */
    private static function canon(string $s): string
    {
        $s = mb_strtolower(trim($s));
        $s = preg_replace('/\s+/', ' ', $s);

        return trim(preg_replace('/\bmaths?\b|\bmathematics\b|\bmathematic\b/u', 'math', $s));
    }

    /**
     * Punctuation flattened to spaces, identically on both sides.
     *
     * This is the half that was missing. The enquiry was being rebuilt from
     * word fragments while a tutor's subjects kept their punctuation, so
     * "Rubik's Cube" became "rubik s cube" on one side and stayed "rubik's
     * cube" on the other — and a tutor whose subject was byte-identical to the
     * course name scored zero for it. Same for "NEET (UG)" and every other
     * course title containing a bracket or an apostrophe.
     */
    private static function flatten(string $s): string
    {
        return trim(preg_replace('/\s+/', ' ', preg_replace('/[^a-z0-9+#]+/u', ' ', $s)));
    }

    /**
     * Split on separators, but only OUTSIDE brackets.
     *
     * A parenthesis holds a qualifier list, not a new request. Splitting
     * blindly turned the live course "Olympiad Preparation (Maths, Science &
     * English)" into three standalone requests, so an IELTS trainer matched the
     * fragment "english" as though it were the whole thing and became the sole
     * top-scoring result for a maths-and-science olympiad course.
     *
     * @return string[]
     */
    private static function splitTop(string $s): array
    {
        $parts = [];
        $buf   = '';
        $depth = 0;
        $len   = strlen($s);

        for ($i = 0; $i < $len; $i++) {
            $ch = $s[$i];

            if ($ch === '(' || $ch === '[') { $depth++; $buf .= $ch; continue; }
            if ($ch === ')' || $ch === ']') { $depth = max(0, $depth - 1); $buf .= $ch; continue; }

            if ($depth === 0) {
                if ($ch === ',' || $ch === ';' || $ch === '/' || $ch === '&') {
                    $parts[] = $buf; $buf = ''; continue;
                }
                // " and " as a separator, but not the "and" inside a word.
                if (($ch === 'a' || $ch === 'A') && substr($s, $i, 5) === ' and '
                    || substr($s, $i, 5) === ' and ') {
                    $parts[] = $buf; $buf = ''; $i += 4; continue;
                }
            }

            $buf .= $ch;
        }

        $parts[] = $buf;

        return array_values(array_filter(array_map('trim', $parts), fn ($p) => $p !== ''));
    }

    /**
     * What the enquiry is asking for, as a list of ALTERNATIVES.
     *
     * A comma, slash or ampersand outside brackets separates different
     * subjects; a space binds one compound. That distinction separates "AI &
     * ML" — two names, either of which is the whole request — from "Western
     * Flute", where "western" alone is a qualifier and matching only it is how
     * a flute enquiry came back with a vocal teacher.
     *
     * Each alternative keeps BOTH forms: `raw` with its stopwords, `phrase`
     * without. "Home Science" needs the first, because dropping "home" leaves
     * "science"; "Class 10 Math" needs the second, because keeping "class"
     * leaves a string no tutor lists.
     *
     * @return Collection<array{raw: string, phrase: string, words: string[]}>
     */
    private static function wanted(?string $subject): Collection
    {
        $canon = self::canon((string) $subject);
        if ($canon === '') return collect();

        return collect(self::splitTop($canon))
            ->map(function (string $alt) {
                $flat  = self::flatten($alt);
                $words = collect(explode(' ', $flat))
                    ->filter()
                    ->reject(fn ($w) => in_array($w, self::NOISE, true))
                    ->reject(fn ($w) => ctype_digit($w))      // the "10" in "Class 10 Math"
                    ->values();

                return ['raw' => $flat, 'phrase' => $words->implode(' '), 'words' => $words->all()];
            })
            ->reject(fn ($a) => $a['words'] === [])
            ->values();
    }

    /**
     * A tutor's subjects, one canonical entry each, normalised exactly as the
     * enquiry is. Split on the same separators — a tutor writing "AI & Machine
     * Learning" means two things they teach — and, like the enquiry, not inside
     * brackets, so "Vocals (Carnatic, Hindustani)" stays one specialism rather
     * than minting a phantom standalone "hindustani".
     *
     * KNOWN LIMIT: that tutor is then matched only as a whole, so an enquiry
     * for "Hindustani Vocal Music" misses them. Nobody on the roster writes
     * their subjects that way, and a miss is the safe failure here — the
     * alternative was minting subjects they never claimed. Worth expanding a
     * parenthetical into "carnatic vocals, hindustani vocals" if that style
     * ever shows up in real data; speculative until it does.
     *
     * @return string[]
     */
    private static function offered(?string $subjects): array
    {
        return collect(self::splitTop(self::canon((string) $subjects)))
            ->map(fn ($s) => self::flatten($s))
            ->reject(fn ($s) => $s === '')
            ->unique()
            ->values()
            ->all();
    }

    /**
     * Does this tutor teach any of the things asked for, and how squarely?
     *
     * score 0 means no — a perfectly good answer that both callers now say out
     * loud. `kind` is 'partial' when the tutor teaches something broader than
     * what was asked for, so the caller can label the chip truthfully.
     *
     * @return array{score: int, kind: ?string, item: ?string}
     */
    private static function subjectFit(Collection $wants, array $offers): array
    {
        $best = ['score' => 0, 'kind' => null, 'item' => null];
        $take = function (array $c) use (&$best) {
            if ($c['score'] > $best['score']) $best = $c;
        };

        foreach ($wants as $want) {
            $n = count($want['words']);

            // The whole request, both with and without its stopwords.
            foreach ([$want['raw'], $want['phrase']] as $whole) {
                $take(self::wholeFit($offers, $whole, $n));
            }

            // Otherwise, how much of the request do they cover? One word is
            // enough only when one word is all that was asked for; beyond that
            // a single lead is an overlap, not a match. Capped below the
            // whole-request score so a partial can never outrank an exact one.
            $hits = 0;
            foreach ($want['words'] as $w) {
                if (self::leads($offers, $w)) $hits++;
            }
            if ($hits >= ($n === 1 ? 1 : 2)) {
                $take(['score' => 2 + $hits, 'kind' => 'subject', 'item' => null]);
                continue;
            }

            // Last chance: one word is EXACTLY something they teach. "Carnatic
            // Violin" is a violin request and a tutor listing "Violin" teaches
            // violin — an imperfect answer, not a wrong one. Exactness is what
            // carries it; leading would let "music" reach "Music Theory" and
            // put a piano teacher back in front of a vocals enquiry.
            foreach ($want['words'] as $w) {
                if (in_array($w, $offers, true)) {
                    $take(['score' => 3, 'kind' => 'partial', 'item' => $w]);
                    break;
                }
            }
        }

        return $best;
    }

    /**
     * The whole request against a tutor's subject list, in BOTH directions.
     *
     * Symmetry is the point. "Python Programming for Beginners" is more
     * specific than the "Python Programming" a tutor lists, and "Music Theory
     * basics" is more specific than "Music Theory" — checking only whether the
     * tutor's wording contains the enquiry's made both match nobody, while the
     * shorter form of the very same request matched at full score.
     *
     * Direction matters to the CLAIM, though, not just the score: a tutor who
     * lists the multi-word "Python Programming" plainly teaches the beginners'
     * course, while one who lists the bare word "Music" has not said they teach
     * Music Theory. The second is scored and labelled as a partial.
     */
    private static function wholeFit(array $offers, string $whole, int $words): array
    {
        if ($whole === '') return ['score' => 0, 'kind' => null, 'item' => null];

        foreach ($offers as $offer) {
            // They list it, or they list something that begins with it:
            // "python" finding "Python Programming".
            if ($offer === $whole || self::startsWithWord($offer, $whole)) {
                return ['score' => 4 + $words, 'kind' => 'subject', 'item' => $offer];
            }

            // The request begins with something they list — it is a more
            // specific version of their subject.
            if (self::startsWithWord($whole, $offer)) {
                return str_contains($offer, ' ')
                    ? ['score' => 4 + $words, 'kind' => 'subject', 'item' => $offer]
                    : ['score' => 3, 'kind' => 'partial', 'item' => $offer];
            }
        }

        return ['score' => 0, 'kind' => null, 'item' => null];
    }

    /** Does any subject LEAD with this token? (Not merely contain it.) */
    private static function leads(array $offers, string $token): bool
    {
        if ($token === '') return false;

        foreach ($offers as $offer) {
            if ($offer === $token || self::startsWithWord($offer, $token)) return true;
        }

        return false;
    }

    /**
     * $haystack starts with $needle, ending on a word boundary.
     *
     * Leading, not containing: "Science" must not find "Computer Science",
     * because a compound subject is a different subject from its head noun —
     * that equivalence is what put programmers in front of a parent looking for
     * school science. And the boundary must be a real one, so "java" cannot run
     * into "javascript".
     *
     * String comparison rather than a regex, so a token ending in punctuation
     * behaves: "C++" could never match under \b, there being no word boundary
     * after a plus sign.
     */
    private static function startsWithWord(string $haystack, string $needle): bool
    {
        if ($needle === '' || $haystack === $needle) return false;
        if (! str_starts_with($haystack, $needle)) return false;

        $next = $haystack[strlen($needle)] ?? '';

        return $next !== '' && ! ctype_alnum($next);
    }
}
