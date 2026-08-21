<?php
namespace Tests\Feature;

use App\Models\Tutor;
use App\Support\TutorMatcher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Who gets suggested to a family on the booking form.
 *
 * Worth pinning, because every failure here is silent and plausible: a wrong
 * suggestion looks exactly like a right one to the code, and the family is the
 * only one who notices that the Class 9 Maths enquiry came back with a Yoga
 * teacher. This is also the highest-intent page on the site, so a bad list is
 * more expensive than an empty one.
 */
class TutorMatcherTest extends TestCase
{
    use RefreshDatabase;

    private function tutor(array $attrs): Tutor
    {
        return Tutor::create($attrs + [
            'name'           => 'T' . uniqid(),
            'slug'           => 'tutor-' . uniqid(),
            'teaching_mode'  => 'online',
            'is_published'   => true,
        ]);
    }

    private function rank(?string $subject, ?string $grade = null, ?string $city = null, bool $home = false)
    {
        return TutorMatcher::rank(Tutor::all(), $subject, $grade, $city, $home);
    }

    public function test_a_named_subject_is_required_not_merely_preferred(): void
    {
        // Nobody teaches Maths; both of these merely happen to cover Class 9.
        $this->tutor(['name' => 'Yoga person', 'subjects' => 'Yoga, Naturopathy', 'grades' => '1-12']);
        $this->tutor(['name' => 'Drummer',     'subjects' => 'Drums, Percussion', 'grades' => '5-10']);

        $this->assertCount(0, $this->rank('Mathematics', '9'),
            'A grade match alone must never qualify a tutor who does not teach the subject.');
    }

    public function test_a_subject_match_qualifies_and_the_grade_only_adds_to_it(): void
    {
        $this->tutor(['name' => 'Maths, right grade', 'subjects' => 'Mathematics, Physics', 'grades' => '9-12']);
        $this->tutor(['name' => 'Maths, wrong grade', 'subjects' => 'Mathematics', 'grades' => '1-5']);

        $out = $this->rank('Mathematics', '9');

        $this->assertCount(2, $out, 'Both teach the subject, so both are eligible.');
        $this->assertSame('Maths, right grade', $out->first()['tutor']->name);
        $this->assertContains('grade', $out->first()['why']);
    }

    public function test_maths_spelling_still_finds_mathematics(): void
    {
        $this->tutor(['subjects' => 'Mathematics', 'grades' => '9']);

        $this->assertCount(1, $this->rank('Maths'));
    }

    public function test_an_online_family_is_not_offered_a_home_only_tutor(): void
    {
        $this->tutor(['subjects' => 'Mathematics', 'teaching_mode' => 'home']);

        $this->assertCount(0, $this->rank('Mathematics'));
    }

    public function test_a_home_family_is_not_offered_an_online_only_tutor(): void
    {
        $this->tutor(['subjects' => 'Mathematics', 'teaching_mode' => 'online', 'city' => 'Kolkata']);

        $this->assertCount(0, $this->rank('Mathematics', null, 'Kolkata', true));
    }

    /** The one case where no subject is needed: "find me anyone who visits my area". */
    public function test_a_home_enquiry_with_only_a_city_still_returns_local_tutors(): void
    {
        $this->tutor(['name' => 'Local',   'subjects' => 'Yoga', 'teaching_mode' => 'home', 'city' => 'Kolkata']);
        $this->tutor(['name' => 'Distant', 'subjects' => 'Yoga', 'teaching_mode' => 'home', 'city' => 'Chennai']);

        $out = $this->rank(null, null, 'Kolkata', true);

        $this->assertSame('Local', $out->first()['tutor']->name);
        $this->assertContains('same-city', $out->first()['why']);
    }

    public function test_being_able_to_visit_homes_is_a_filter_not_a_reason_to_suggest(): void
    {
        // Teaches nothing relevant, but does visit homes. Must not surface for
        // a Piano enquiry just because the mode fits.
        $this->tutor(['subjects' => 'Yoga', 'teaching_mode' => 'home', 'city' => 'Pune']);

        $this->assertCount(0, $this->rank('Piano', null, 'Kolkata', true));
    }

    public function test_an_unpublished_tutor_is_never_ranked(): void
    {
        // rank() is handed whatever the caller selected; the callers pass
        // published() only. This pins that the caller's filter is the gate.
        $this->tutor(['subjects' => 'Mathematics', 'is_published' => false]);

        $this->assertCount(1, TutorMatcher::rank(Tutor::all(), 'Mathematics', null, null, false),
            'rank() itself does not filter — the endpoint must pass published tutors.');
        $this->assertCount(0, TutorMatcher::rank(Tutor::published()->get(), 'Mathematics', null, null, false));
    }

    /**
     * The bypass that made the subject requirement optional.
     *
     * The old tokeniser dropped fragments under three characters and never
     * split on whitespace, so "AI & ML" produced an EMPTY token set. An empty
     * set skipped the subject check completely, the grade point alone cleared
     * the score gate, and the enquiry came back with every tutor on the site.
     * The requirement was still in the code and still passing its own test; it
     * simply was not reached. That is the failure mode worth a regression test.
     */
    public function test_a_subject_that_tokenises_to_nothing_still_requires_a_subject(): void
    {
        $this->tutor(['name' => 'Yoga person', 'subjects' => 'Yoga, Naturopathy', 'grades' => '1-12']);
        $this->tutor(['name' => 'Singer',      'subjects' => 'Classical Vocals',  'grades' => '1-12']);

        foreach (['AI & ML', 'C++', 'C#'] as $subject) {
            $this->assertCount(0, $this->rank($subject, '9'),
                "\"{$subject}\" matches nobody here and must return nobody, not everybody.");
        }
    }

    public function test_short_subjects_match_the_tutor_who_actually_teaches_them(): void
    {
        $this->tutor(['name' => 'AI person', 'subjects' => 'AI & ML, Python', 'grades' => '9-12']);
        $this->tutor(['name' => 'Yoga person', 'subjects' => 'Yoga', 'grades' => '1-12']);

        $out = $this->rank('AI & ML', '9');

        $this->assertCount(1, $out);
        $this->assertSame('AI person', $out->first()['tutor']->name);
    }

    /**
     * The booking form's own placeholder is "e.g. Class 10 Math". It matched
     * nothing, because the whole string had to appear verbatim in a tutor's
     * subject list. The likeliest thing a parent types was the one shape the
     * matcher could not read.
     */
    public function test_the_booking_forms_own_placeholder_finds_a_maths_teacher(): void
    {
        $this->tutor(['name' => 'Maths teacher', 'subjects' => 'Mathematics', 'grades' => '6-12']);

        foreach (['Class 10 Math', 'Class 10 Maths', 'class 10 mathematics'] as $typed) {
            $out = $this->rank($typed, '10');
            $this->assertCount(1, $out, "A parent typing \"{$typed}\" must reach the Maths teacher.");
            $this->assertSame('Maths teacher', $out->first()['tutor']->name);
        }
    }

    /**
     * Enquiry words must not qualify a tutor on their own. "Class" is the trap:
     * it is a prefix of "Classical Vocals", so a maths enquiry that kept the
     * word "class" as a token silently returned a singing teacher.
     */
    public function test_enquiry_words_do_not_match_subjects(): void
    {
        $this->tutor(['name' => 'Singer', 'subjects' => 'Classical Vocals', 'grades' => '1-12']);

        $this->assertCount(0, $this->rank('Class 10 Math', '10'),
            '"Class" must not match "Classical".');
        $this->assertCount(0, $this->rank('Online tuition', '10'),
            'Words describing the arrangement are not subjects.');
    }

    /**
     * A token shorter than four characters must be a whole word, or "art"
     * reaches "Bharatnatyam" and every three-letter enquiry becomes a lucky dip.
     */
    public function test_a_short_token_must_be_a_whole_word_not_a_fragment(): void
    {
        // "ai" sits inside "painting" as a bare substring, and this site really
        // does teach both Painting and AI & ML — so matching one against the
        // other is a false positive that would genuinely have reached a family.
        $this->tutor(['name' => 'Painter', 'subjects' => 'Painting, Sketching', 'grades' => '1-12']);
        $this->tutor(['name' => 'Dancer',  'subjects' => 'Bharatnatyam',        'grades' => '1-12']);

        $this->assertCount(0, $this->rank('AI'), '"AI" must not match "Painting".');
    }

    /**
     * Both are defensible results; only one is what was asked for. Before the
     * phrase was scored above the word, an enquiry for "Vocal Music" put the
     * actual vocal teacher THIRD, behind two people who merely list "Music
     * Theory". Ordering is the whole product here — families read the top row.
     */
    /**
     * One word of a multi-word request is an overlap, not a match.
     *
     * This test used to assert the pianist was "a reasonable second" for a
     * Vocal Music enquiry. Review disagreed, and review was right: the chip
     * next to that name reads "teaches this subject", and a Music Theory
     * listing is not a claim to teach vocals. On the live roster the same
     * leniency put two piano teachers ABOVE the site's only vocal teacher on
     * her own three course pages, because a one-word overlap scored the same
     * as a full match. Being second is not harmless when second is wrong.
     */
    public function test_a_single_word_overlap_is_not_a_match(): void
    {
        $this->tutor(['name' => 'Vocal teacher', 'subjects' => 'Vocal Music', 'grades' => '1-12']);
        $this->tutor(['name' => 'Pianist',       'subjects' => 'Piano, Music Theory', 'grades' => '1-12']);

        $out = $this->rank('Vocal Music');

        $this->assertCount(1, $out, 'Sharing the word "music" is not teaching vocals.');
        $this->assertSame('Vocal teacher', $out->first()['tutor']->name);
    }

    /**
     * The mirror: when one word is the WHOLE request, one word is enough.
     */
    public function test_a_single_word_request_still_matches_on_that_word(): void
    {
        $this->tutor(['name' => 'Pianist', 'subjects' => 'Piano, Music Theory', 'grades' => '1-12']);

        $this->assertCount(1, $this->rank('Piano'));
        $this->assertCount(1, $this->rank('Music Theory'));
    }

    /**
     * A compound subject is a different subject from its head noun. Sharing it
     * put two programmers in front of a parent looking for school science for a
     * ten-year-old, badged as teaching it.
     */
    public function test_a_qualified_subject_does_not_answer_the_bare_one(): void
    {
        $this->tutor(['name' => 'Programmer', 'subjects' => 'Computer Science, Data Science', 'grades' => '1-12']);

        $this->assertCount(0, $this->rank('Science Grade 1-7', '5'));
        $this->assertCount(0, $this->rank('Social Science Grade 8', '8'));
        // ...but the subject they really do teach still finds them.
        $this->assertCount(1, $this->rank('Computer Science Grade 11-12', '11'));
    }

    /**
     * Nothing but a grade must never qualify anybody. Subject is optional on
     * the booking form, so this is reachable from the live site, and it was
     * returning every published tutor on the roster.
     */
    public function test_a_blank_subject_suggests_nobody(): void
    {
        $this->tutor(['name' => 'Yoga person', 'subjects' => 'Yoga', 'grades' => '1-12']);
        $this->tutor(['name' => 'Drummer',     'subjects' => 'Drums', 'grades' => '1-12']);

        foreach ([null, '', '   '] as $blank) {
            $this->assertCount(0, $this->rank($blank, '9'),
                'A grade is not a request for anything.');
        }
    }

    /**
     * ...except for a home enquiry, where "visits homes in your city" is a true
     * and useful thing to say even with no subject, and the chips say exactly
     * that rather than claiming a subject.
     */
    public function test_a_home_enquiry_with_a_city_still_finds_someone_without_a_subject(): void
    {
        $t = $this->tutor(['name' => 'Local', 'subjects' => 'Yoga', 'city' => 'Kolkata', 'teaching_mode' => 'home']);

        $out = $this->rank(null, null, 'Kolkata', true);

        $this->assertCount(1, $out);
        $this->assertContains('same-city', $out->first()['why']);
        $this->assertNotContains('subject', $out->first()['why'], 'No subject was asked for, so none is claimed.');
    }

    /** Both spellings, both sides. A tutor writing "Maths" must be findable. */
    public function test_maths_and_mathematics_are_the_same_subject_either_way_round(): void
    {
        $this->tutor(['name' => 'Maths teacher', 'subjects' => 'Maths, Physics', 'grades' => '6-12']);

        foreach (['Mathematics Grade 11-12', 'Class 10 Math', 'maths'] as $typed) {
            $this->assertCount(1, $this->rank($typed), "\"{$typed}\" must reach a tutor listing \"Maths\".");
        }
    }

    /**
     * An ampersand separates alternatives on BOTH sides. "AI & ML" is two
     * names either of which is the whole request, and a tutor writing
     * "AI & Machine Learning" means two things they teach.
     */
    public function test_an_ampersand_separates_subjects_on_both_sides(): void
    {
        $this->tutor(['name' => 'AI person', 'subjects' => 'Python Programming, AI & Machine Learning']);

        foreach (['AI & ML', 'Machine Learning', 'Artificial Intelligence & Machine Learning'] as $typed) {
            $this->assertGreaterThan(0, $this->rank($typed)->count(), "\"{$typed}\" found nobody.");
        }
    }

    /**
     * A space binds a compound, so only the qualifier matching is not a match.
     * "Western Flute" against "Western Vocals" is the case that reached a
     * family: a flute enquiry answered by a singing teacher.
     */
    public function test_matching_only_the_qualifier_of_a_compound_is_not_a_match(): void
    {
        $this->tutor(['name' => 'Singer', 'subjects' => 'Vocal Music, Western Vocals, Carnatic Vocals']);

        $this->assertCount(0, $this->rank('Western Flute'));
        // The same singer is still the right answer to what she does teach.
        $this->assertCount(1, $this->rank('Western Vocal Music'));
    }

    /** A prefix stops at a boundary: Java is not JavaScript. */
    public function test_a_prefix_does_not_run_into_a_different_subject(): void
    {
        $this->tutor(['name' => 'Front-end dev', 'subjects' => 'JavaScript, CSS']);

        $this->assertCount(0, $this->rank('Java'));
        $this->assertCount(1, $this->rank('JavaScript'));
    }

    // ---- round three: what adversarial review found in the round-two fix ----

    /**
     * Matching must work in BOTH directions.
     *
     * Requiring the tutor's wording to contain the enquiry's fixed the
     * "one shared word" defect and created a worse one: any enquiry MORE
     * specific than a tutor's own phrasing matched nobody. "Python Programming
     * for Beginners" is a real, featured course, and it found neither of the
     * two people who list "Python Programming" — while the shorter form of the
     * very same request matched both at full score.
     */
    public function test_an_enquiry_more_specific_than_the_tutors_wording_still_matches(): void
    {
        $this->tutor(['name' => 'Coder', 'subjects' => 'Python Programming, Web Development']);

        foreach ([
            'Python Programming for Beginners',
            'Python Programming for Kids — Code Your First Projects',
            'Web Development bootcamp',
            'Python',
        ] as $typed) {
            $this->assertCount(1, $this->rank($typed), "\"{$typed}\" found nobody.");
        }
    }

    /**
     * ...and the reverse direction must still not claim too much. A tutor who
     * lists the bare word "Music" has not said they teach Music Theory, so they
     * may appear, but labelled for what they actually offer.
     */
    public function test_a_broader_subject_answers_as_a_partial_not_as_the_thing_asked_for(): void
    {
        $this->tutor(['name' => 'Generalist', 'subjects' => 'Music']);

        $out = $this->rank('Music Theory');

        $this->assertCount(1, $out);
        $this->assertContains('teaches Music', $out->first()['why']);
        $this->assertNotContains('subject', $out->first()['why'],
            'Listing "Music" is not a claim to teach Music Theory.');
    }

    /**
     * Punctuation must be normalised identically on both sides. It was not:
     * the enquiry was rebuilt from word fragments while the tutor's subjects
     * kept their apostrophes and brackets, so a tutor whose subject string was
     * BYTE-IDENTICAL to the course name scored zero for that course.
     */
    public function test_a_tutor_whose_subject_is_the_course_name_matches_that_course(): void
    {
        foreach (["Rubik's Cube", 'NEET (UG)', 'Vedic Maths (Advanced)', 'C++', 'Arts & Painting'] as $name) {
            Tutor::query()->delete();
            $this->tutor(['name' => 'T', 'subjects' => $name]);

            $this->assertCount(1, $this->rank($name), "A tutor listing exactly \"{$name}\" did not match it.");
        }
    }

    /**
     * A subject made only of stopwords and digits is NOT the same as no subject.
     * Treating it as one let a home enquiry fall through to the city branch and
     * return the whole roster — for "Class 10", which is the shape the booking
     * form's own placeholder teaches.
     */
    public function test_a_subject_that_is_all_noise_suggests_nobody(): void
    {
        $this->tutor(['name' => 'Yoga person', 'subjects' => 'Yoga', 'city' => 'Kolkata', 'teaching_mode' => 'home']);
        $this->tutor(['name' => 'Drummer',     'subjects' => 'Drums', 'city' => 'Kolkata', 'teaching_mode' => 'home']);

        foreach (['Class 10', 'online tuition', 'std 5'] as $typed) {
            $this->assertCount(0, $this->rank($typed, null, 'Kolkata', true),
                "\"{$typed}\" named something we cannot read — that is not a request for everybody.");
        }

        // The documented exception is unchanged: naming NOTHING still works.
        $this->assertCount(2, $this->rank(null, null, 'Kolkata', true));
    }

    /**
     * A parenthesised list is a qualifier, not a set of separate requests.
     * Splitting it blindly made an IELTS trainer the sole top-scoring result
     * for a live maths-and-science olympiad course, because the fragment
     * "english" was treated as the whole request.
     */
    public function test_a_bracketed_list_is_not_split_into_separate_requests(): void
    {
        $this->tutor(['name' => 'English teacher', 'subjects' => 'English, IELTS Training']);

        $out = $this->rank('Olympiad Preparation (Maths, Science & English)');

        // Nobody. She teaches one of the three subjects the course covers,
        // which is not teaching the course — and she was its ONLY card,
        // badged "teaches this subject", on a maths-and-science page.
        $this->assertCount(0, $out);

        // ...and nothing here may score as the whole request either way.
        foreach ($out as $row) {
            $this->assertNotContains('subject', $row['why']);
        }
    }

    /** An ampersand OUTSIDE brackets still separates alternatives. */
    public function test_an_ampersand_outside_brackets_still_splits(): void
    {
        $this->tutor(['name' => 'AI person', 'subjects' => 'AI & Machine Learning']);

        foreach (['AI & ML', 'Machine Learning', 'AI'] as $typed) {
            $this->assertCount(1, $this->rank($typed), "\"{$typed}\" found nobody.");
        }
    }

    /**
     * Words naming the FORMAT are not the subject. "IELTS coaching" found
     * nobody while "IELTS Training" found the IELTS trainer — the two differ
     * only in a word that says what kind of teaching it is.
     */
    public function test_words_describing_the_format_are_not_part_of_the_subject(): void
    {
        $this->tutor(['name' => 'Anney', 'subjects' => 'English, IELTS Training']);

        foreach (['IELTS coaching', 'IELTS preparation', 'IELTS Training for adults', 'IELTS'] as $typed) {
            $this->assertCount(1, $this->rank($typed), "\"{$typed}\" found nobody.");
        }
    }

    /** An exact match must always outrank a partial one. */
    public function test_an_exact_match_outranks_a_partial(): void
    {
        $this->tutor(['name' => 'Vocalist', 'subjects' => 'Vocal Music']);
        $this->tutor(['name' => 'Generalist', 'subjects' => 'Piano, Music']);

        $out = $this->rank('Vocal Music');

        $this->assertSame('Vocalist', $out->first()['tutor']->name);
        $this->assertGreaterThan($out->last()['score'], $out->first()['score']);
    }

    // ---- round four: what the second adversarial pass found -----------------

    /**
     * A shared PREFIX is not a claim to teach the thing asked for.
     *
     * Scoring it as one made a tutor listing "Vocal Music" the sole result for
     * "Vocal Music Theory" at the top of the scale, badged "teaches this
     * subject", while BOTH people who list "Music Theory" verbatim scored zero
     * and were filtered out of the shortlist entirely.
     */
    public function test_a_shared_prefix_is_not_a_claim_to_teach_the_request(): void
    {
        $this->tutor(['name' => 'Vocalist',   'subjects' => 'Vocal Music, Carnatic Vocals']);
        $this->tutor(['name' => 'Theorist',   'subjects' => 'Music Theory, Piano']);

        $out = $this->rank('Vocal Music Theory');

        $vocalist = $out->first(fn ($r) => $r['tutor']->name === 'Vocalist');
        $this->assertNotNull($vocalist);
        $this->assertNotContains('subject', $vocalist['why'],
            'Listing "Vocal Music" is not a claim to teach Vocal Music Theory.');
    }

    /**
     * A LEVEL is part of what is being bought. Stripping it collapsed products
     * the catalogue sells separately: /courses/jee-advanced ranked a
     * JEE-Main-only tutor first, badged as teaching it.
     */
    public function test_a_level_qualifier_keeps_two_products_apart(): void
    {
        $this->tutor(['name' => 'Main coach',     'subjects' => 'JEE Main']);
        $this->tutor(['name' => 'Advanced coach', 'subjects' => 'JEE Advanced']);

        $adv = $this->rank('JEE Advanced');
        $this->assertCount(1, $adv);
        $this->assertSame('Advanced coach', $adv->first()['tutor']->name);

        $main = $this->rank('JEE Main');
        $this->assertCount(1, $main);
        $this->assertSame('Main coach', $main->first()['tutor']->name);
    }

    /**
     * The ORDER a tutor happens to type their subjects in must not change their
     * score. It did: "Python, Python Programming" scored a 3-point partial
     * while the same two subjects the other way round scored a full match — and
     * with the callers taking only the top six or eight, that drops people off
     * the list for editing an unrelated field.
     */
    public function test_the_order_of_a_tutors_own_subjects_does_not_change_their_score(): void
    {
        $this->tutor(['name' => 'A', 'subjects' => 'Python, Python Programming']);
        $first = $this->rank('Python Programming')->first();

        Tutor::query()->delete();
        $this->tutor(['name' => 'B', 'subjects' => 'Python Programming, Python']);
        $second = $this->rank('Python Programming')->first();

        $this->assertSame($first['score'], $second['score']);
        $this->assertSame($first['why'], $second['why']);
        $this->assertContains('subject', $first['why'], 'They list it verbatim either way round.');
    }

    /**
     * One word out of four is not a match. Without a floor on the exact-word
     * rescue, the live Olympiad course came back with an IELTS trainer as its
     * only card — she teaches one of the three subjects it covers.
     */
    public function test_one_word_of_a_long_request_does_not_qualify(): void
    {
        $this->tutor(['name' => 'English teacher', 'subjects' => 'English, IELTS Training']);

        $this->assertCount(0, $this->rank('Olympiad Preparation (Maths, Science & English)'));
        // Two words still may — that is the Carnatic Violin case the rule keeps.
        Tutor::query()->delete();
        $this->tutor(['name' => 'Violinist', 'subjects' => 'Violin']);
        $this->assertCount(1, $this->rank('Carnatic Violin'));
    }

    /** The chip quotes the teacher's own wording, not the parser's lower-cased token. */
    public function test_the_partial_chip_quotes_the_teachers_own_wording(): void
    {
        $this->tutor(['name' => 'Rahul', 'subjects' => 'AI & Machine Learning']);

        $out = $this->rank('AI Prompting');

        $this->assertCount(1, $out);
        $this->assertContains('teaches AI', $out->first()['why'], 'It read "teaches Ai".');
    }
}
