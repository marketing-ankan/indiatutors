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
}
