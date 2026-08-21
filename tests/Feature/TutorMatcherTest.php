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
    public function test_an_exact_phrase_outranks_a_single_word_overlap(): void
    {
        $this->tutor(['name' => 'Vocal teacher', 'subjects' => 'Vocal Music', 'grades' => '1-12']);
        $this->tutor(['name' => 'Pianist',       'subjects' => 'Piano, Music Theory', 'grades' => '1-12']);

        $out = $this->rank('Vocal Music');

        $this->assertCount(2, $out, 'The music teacher is still a reasonable second.');
        $this->assertSame('Vocal teacher', $out->first()['tutor']->name);
        $this->assertGreaterThan($out->last()['score'], $out->first()['score']);
    }
}
