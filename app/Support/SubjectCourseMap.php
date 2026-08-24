<?php
namespace App\Support;

use App\Models\Category;
use App\Models\Course;
use Illuminate\Support\Facades\DB;

/**
 * The one place a teacher's free-text subject becomes a catalogue course.
 *
 * tutors.subjects is a comma string a human typed ("Violin, Music Theory,
 * Piano"). The catalogue is 110 named courses. Nothing joins them, so every
 * screen that wants "which courses does this teacher's subject correspond to"
 * has to guess — and if two screens guess differently, staff are told two
 * different things about the same teacher. Hence one class.
 *
 * THE RULE: a subject matches a course when it BEGINS the course's name or one
 * of the name's phrases. Not "appears anywhere in".
 *
 * A plain substring test is wrong in the obvious way — "Art" inside "Bharat" —
 * but a word-boundary test alone is still wrong here, and the catalogue proves
 * it: "Science" is a whole word inside "Social Science Grade 1-7", "Political
 * Science Grade 11-12", "Computer Science Grade 11-12" and "Data Science". All
 * four are different subjects taught by different people. What makes them
 * different is the qualifier in front, so the qualifier is what disqualifies
 * the match. Requiring the subject to start a phrase rejects all four and still
 * accepts "Science Grade 1-7" and "Olympiad Preparation (Maths, Science &
 * English)", where "Science" heads a phrase of its own.
 *
 * The same rule costs us "Dance" -> "Bollywood Dance" and "Violin" -> "Carnatic
 * Violin", which are structurally identical to "Science" -> "Social Science"
 * and cannot be kept without keeping that one. Under-suggesting is the safe
 * direction: this feeds a staff suggestion list, and a wrong suggestion hands a
 * Western violin teacher a Carnatic syllabus.
 *
 * Matching runs one way only — course name contains subject, never the reverse.
 * "Spanish Language" therefore does not reach the course "Spanish". That is
 * deliberate: reversing it would also make "Science" reach every course whose
 * name is a fragment of a longer subject.
 *
 * Declining to suggest is not the same statement as "the catalogue has no such
 * course", so the two are returned separately. "Dance" heads no course name, but
 * the catalogue carries seven Dance courses and a Dance category — telling staff
 * nothing can be handed out for it would be false, and it invites them to create
 * a course that already exists. Such a subject comes back in `ambiguous` with the
 * courses that do mention it; `unmatched` is reserved for a subject the catalogue
 * genuinely does not carry anywhere, which is the only case where "no course
 * covers this" is true.
 *
 * Everything is filtered in PHP rather than SQL because sqlite ships without
 * REGEXP and MySQL's word boundaries differ from PCRE's; a matcher that behaves
 * differently on the preview database than in production is worse than no
 * matcher. The catalogue is cached in statics because this runs once per
 * teacher across the whole roster.
 */
class SubjectCourseMap
{
    /**
     * Words that describe how a course is delivered or sold, not what it
     * teaches. Skipping them at the head of a phrase is what lets "Piano" reach
     * "Online Piano & Keyboard Classes" while "Science" still cannot reach
     * "Social Science" — "Social" names a subject, "Online" does not.
     */
    private const DECORATION = [
        'online', 'offline', 'live', 'virtual', 'customized', 'customised',
        'personalized', 'personalised', 'certified', 'professional',
        'complete', 'comprehensive', 'learn', 'the', 'new', 'best', 'top',
    ];

    /**
     * Spellings of one subject that no suffix rule can bridge.
     *
     * "Maths" is the standard Indian spelling and the site's own catalogue uses
     * it, but singular() reduces it to "math" and "Mathematics" to "mathematic",
     * so the two never met: a teacher who wrote "Maths" reached none of the five
     * Mathematics courses and was filed under Competitive Exams on the strength
     * of one Olympiad fragment. TutorMatcher::canon, SubstituteFinder and
     * VideoCourseRequest already fold these three; this class was the one that
     * did not, which is exactly the disagreement it exists to prevent.
     */
    private const SYNONYMS = [
        'maths'       => 'math',
        'mathematics' => 'math',
        'mathematic'  => 'math',
    ];

    /** @var array<int,array{id:int,name:string,slug:string,lower:string,normal:string,phrases:array<int,string>}>|null */
    private static ?array $catalogue = null;

    /** @var array<int,int|null>|null  category id => parent id */
    private static ?array $parents = null;

    /** @var array<int,array<int,int>>|null  course id => category ids */
    private static ?array $courseCategories = null;

    /** @var array<int,string>|null  category id => normalised name */
    private static ?array $categoryNames = null;

    /**
     * Courses matched from a teacher's subject list, plus the subjects that
     * reached nothing and why.
     *
     * Exact name equality ranks first: a teacher who wrote "Piano" means the
     * course called "Piano" before it means "Online Piano & Keyboard Classes".
     *
     * @param  array<int,string>  $subjects
     * @return array{courses: array<int,array{id:int,name:string,slug:string,matched_on:string,exact:bool}>, unmatched: array<int,string>, ambiguous: array<int,array{subject:string,courses:array<int,string>}>}
     */
    public static function coursesForSubjects(array $subjects): array
    {
        $matched   = [];
        $unmatched = [];
        $ambiguous = [];

        foreach ($subjects as $subject) {
            $subject = trim((string) $subject);
            if ($subject === '') {
                continue;
            }

            $hits = self::matchesFor($subject);
            if (! $hits) {
                // Nothing was headed by this subject. Whether that means the
                // catalogue does not carry it, or only that the rule declined a
                // course it does carry, is the difference between an honest gap
                // and a false claim on the screen.
                if ($mentions = self::catalogueMentions($subject)) {
                    $ambiguous[$subject] = ['subject' => $subject, 'courses' => $mentions];
                } else {
                    $unmatched[] = $subject;
                }
                continue;
            }

            foreach ($hits as $hit) {
                // First subject to claim a course keeps it, unless a later one
                // matched it exactly — an exact hit is the better explanation.
                $id = $hit['id'];
                if (! isset($matched[$id]) || ($hit['exact'] && ! $matched[$id]['exact'])) {
                    $matched[$id] = $hit;
                }
            }
        }

        $courses = array_values($matched);
        usort($courses, fn ($a, $b) => [$b['exact'], $a['name']] <=> [$a['exact'], $b['name']]);

        return [
            'courses'   => $courses,
            'unmatched' => array_values(array_unique($unmatched)),
            'ambiguous' => array_values($ambiguous),
        ];
    }

    /**
     * Course names the catalogue carries for a subject nothing was headed by.
     *
     * Two tests, because the catalogue names a subject in two places. A course
     * name that mentions it anywhere is the obvious one — seven courses mention
     * "Dance", three mention "Vocal Music". The second is the site's own
     * navigation, and it is not redundant: six root category names, "Musical
     * Instruments" and "IT Technologies" among them, appear in no course name at
     * all, so a teacher who writes their subject the way the menu spells it would
     * otherwise be told the catalogue does not carry it with twenty-two courses
     * sitting underneath.
     *
     * Deliberately looser than the matching rule: this answers "does this exist
     * here", not "which course should this teacher get". It never adds a
     * suggestion — it only decides which of two sentences the console may say.
     *
     * @return array<int,string>
     */
    private static function catalogueMentions(string $subject): array
    {
        static $memo = [];
        $needle = trim(self::normalisedName($subject));
        if ($needle === '') {
            return [];
        }
        if (isset($memo[$needle])) {
            return $memo[$needle];
        }

        $names = [];
        foreach (self::catalogue() as $course) {
            if (str_contains($course['normal'], " {$needle} ")) {
                $names[$course['id']] = $course['name'];
            }
        }

        self::loadCategories();
        foreach (self::$categoryNames as $categoryId => $categoryName) {
            if ($categoryName !== $needle) {
                continue;
            }
            foreach (self::catalogue() as $course) {
                if (isset($names[$course['id']])) {
                    continue;
                }
                foreach (self::$courseCategories[$course['id']] ?? [] as $tagged) {
                    if (self::isUnder($tagged, (int) $categoryId)) {
                        $names[$course['id']] = $course['name'];
                        break;
                    }
                }
            }
        }

        sort($names);

        return $memo[$needle] = $names;
    }

    /** Is $categoryId the category $ancestor itself, or one of its descendants? */
    private static function isUnder(int $categoryId, int $ancestor): bool
    {
        $seen = [];
        $id   = $categoryId;

        while (! isset($seen[$id])) {
            if ($id === $ancestor) {
                return true;
            }
            if (! array_key_exists($id, self::$parents)) {
                return false;
            }
            $seen[$id] = true;
            $parent = self::$parents[$id];
            if ($parent === null) {
                return false;
            }
            $id = (int) $parent;
        }

        return false;                              // cycle — see rootOf()
    }

    /**
     * Root categories for a set of courses.
     *
     * Chip rows are built from the 10 roots, so a course tagged with the child
     * category "Piano" has to resolve up to "Musical Instruments".
     *
     * @param  array<int,int>  $courseIds
     * @return array<int,int>
     */
    public static function rootCategoryIdsForCourses(array $courseIds): array
    {
        if (! $courseIds) {
            return [];
        }

        self::loadCategories();

        $roots = [];
        foreach ($courseIds as $courseId) {
            foreach (self::$courseCategories[$courseId] ?? [] as $categoryId) {
                if ($root = self::rootOf($categoryId)) {
                    $roots[$root] = true;
                }
            }
        }

        return array_map('intval', array_keys($roots));
    }

    /** id => name for the 10 roots, in catalogue order — the chip row's labels. */
    public static function rootCategoryNames(): array
    {
        static $names = null;

        return $names ??= Category::query()->roots()
            ->orderBy('position')->orderBy('name')
            ->pluck('name', 'id')->all();
    }

    /**
     * Walk parent_id to the top.
     *
     * The visited set is not defensive padding: parent_id is a nullable
     * self-reference with no database-level guard against a cycle, and one row
     * pointed at itself would hang every request that renders this screen.
     */
    private static function rootOf(int $categoryId): ?int
    {
        $seen = [];
        $id   = $categoryId;

        while ($id !== null && ! isset($seen[$id])) {
            if (! array_key_exists($id, self::$parents)) {
                return null;                       // pivot row pointing at a deleted category
            }
            $seen[$id] = true;
            $parent = self::$parents[$id];
            if ($parent === null) {
                return $id;
            }
            $id = (int) $parent;
        }

        return null;                               // cycle — no root exists to return
    }

    /**
     * @return array<int,array{id:int,name:string,slug:string,matched_on:string,exact:bool}>
     */
    private static function matchesFor(string $subject): array
    {
        static $memo = [];
        $key = mb_strtolower($subject);
        if (isset($memo[$key])) {
            return $memo[$key];
        }

        $phrases = self::phrases($subject);
        $out     = [];

        foreach (self::catalogue() as $course) {
            $exact = $course['lower'] === $key;
            if (! $exact && ! self::headsAnyPhrase($phrases, $course['phrases'])) {
                continue;
            }
            $out[] = [
                'id'         => $course['id'],
                'name'       => $course['name'],
                'slug'       => $course['slug'],
                'matched_on' => $subject,
                'exact'      => $exact,
            ];
        }

        return $memo[$key] = $out;
    }

    /**
     * The boundary is whitespace, a hyphen or the end of the phrase — not merely
     * "not a letter or digit". Under the looser test the subject "C" headed the
     * phrase "c++", because '+' is neither, and C and C++ are different
     * languages. Hyphen has to stay a boundary: this catalogue writes grade
     * ranges as "Grade 9-10", and "English Grade 9" is a real way to say it.
     *
     * @param array<int,string> $needles @param array<int,string> $haystacks
     */
    private static function headsAnyPhrase(array $needles, array $haystacks): bool
    {
        foreach ($needles as $needle) {
            $pattern = '/^' . preg_quote($needle, '/') . '(?=$|[\s\-])/u';
            foreach ($haystacks as $haystack) {
                if (preg_match($pattern, $haystack)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Break a name into the phrases a subject may head, normalised for
     * comparison.
     *
     * The plain hyphen is NOT a separator: this catalogue writes grade ranges as
     * "Grade 1-7", and splitting there would turn every academic course into a
     * phrase ending in a digit for no gain.
     *
     * @return array<int,string>
     */
    private static function phrases(string $name): array
    {
        $lower = mb_strtolower($name);

        // A parenthetical means one of two things here, and only one of them is
        // a phrase a subject may head. "Olympiad Preparation (Maths, Science &
        // English)" enumerates subjects and must be reachable from "Science" —
        // that is the case the whole head-of-phrase rule was written around. A
        // parenthetical holding a single item qualifies the head instead: "NEET
        // (UG)", "CUET (UG)", "Vedic Maths (Advanced)". Treating "ug" as a
        // phrase of its own offered a NEET tutor the CUET syllabus, which is the
        // wrong-syllabus harm this class exists to prevent.
        $lists = [];
        $base  = preg_replace_callback('/\(([^)]*)\)/u', function (array $m) use (&$lists) {
            if (preg_match('/[,;&\/|]|\band\b/iu', $m[1])) {
                $lists[] = $m[1];
            }

            return ' ';
        }, $lower) ?? $lower;

        $parts = self::split($base);
        foreach ($lists as $list) {
            $parts = array_merge($parts, self::split($list));
        }

        $out = [];
        foreach ($parts as $part) {
            $words = preg_split('/\s+/u', trim($part), -1, PREG_SPLIT_NO_EMPTY) ?: [];
            while ($words && in_array($words[0], self::DECORATION, true)) {
                array_shift($words);
            }
            if (! $words) {
                continue;
            }
            $out[] = implode(' ', array_map(self::normaliseWord(...), $words));
        }

        return array_values(array_unique($out));
    }

    /** @return array<int,string> */
    private static function split(string $text): array
    {
        return preg_split('/\s*(?:[—–:;,()\[\]\/|&]|\band\b)\s*/iu', $text) ?: [];
    }

    /**
     * The whole name as one normalised, space-padded string — for asking whether
     * the catalogue mentions a subject at all, which is a different question
     * from which course a subject heads. Punctuation is dropped rather than used
     * as a boundary, so "Rubik's Cube" and "NEET (UG)" both flatten to their
     * words.
     */
    private static function normalisedName(string $name): string
    {
        $words = preg_split('/[^\p{L}\p{N}\'\x{2019}\x{2018}\-]+/u', mb_strtolower($name), -1, PREG_SPLIT_NO_EMPTY) ?: [];

        return ' ' . implode(' ', array_map(self::normaliseWord(...), $words)) . ' ';
    }

    /**
     * One word, reduced to the form both sides are compared in.
     *
     * The apostrophe is neither a separator nor part of the word. The catalogue
     * writes "Rubik's Cube"; a teacher types "Rubiks Cube" or pastes the curly
     * quote their word processor produced, and all three have to reach the same
     * course. Leaving it in also fed singular() a possessive, which it read as a
     * plural and clipped to "rubik'".
     */
    private static function normaliseWord(string $word): string
    {
        $word = str_replace(["'", "\u{2019}", "\u{2018}"], '', $word);

        return self::singular(self::SYNONYMS[$word] ?? $word);
    }

    /**
     * Crude singularisation, applied to BOTH sides so it only ever has to be
     * self-consistent. It exists for one measured case: teachers write
     * "Carnatic Vocals" and the catalogue says "Carnatic Vocal Music". Words
     * ending "ss" are left alone so Chess, Class and Business survive.
     */
    private static function singular(string $word): string
    {
        if (mb_strlen($word) > 3 && str_ends_with($word, 's') && ! str_ends_with($word, 'ss')) {
            return mb_substr($word, 0, -1);
        }

        return $word;
    }

    /** @return array<int,array{id:int,name:string,slug:string,lower:string,phrases:array<int,string>}> */
    private static function catalogue(): array
    {
        if (self::$catalogue !== null) {
            return self::$catalogue;
        }

        return self::$catalogue = Course::query()
            ->orderBy('id')
            ->get(['id', 'name', 'slug'])
            ->map(fn (Course $c) => [
                'id'      => (int) $c->id,
                'name'    => $c->name,
                'slug'    => $c->slug,
                'lower'   => mb_strtolower($c->name),
                'normal'  => self::normalisedName($c->name),
                'phrases' => self::phrases($c->name),
            ])->all();
    }

    private static function loadCategories(): void
    {
        if (self::$parents !== null) {
            return;
        }

        self::$parents = Category::query()->pluck('parent_id', 'id')
            ->map(fn ($p) => $p === null ? null : (int) $p)->all();

        self::$categoryNames = Category::query()->pluck('name', 'id')
            ->map(fn ($n) => trim(self::normalisedName((string) $n)))->all();

        self::$courseCategories = [];
        foreach (DB::table('category_course')->get(['course_id', 'category_id']) as $row) {
            self::$courseCategories[(int) $row->course_id][] = (int) $row->category_id;
        }
    }
}
