<?php
namespace Tests\Feature;

use App\Models\TeacherProfile;
use App\Models\Tutor;
use App\Models\User;
use App\Support\TeacherProfilePublisher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The classes a teacher says they teach, reaching their public listing.
 *
 * Before this field existed, the publisher seeded the whole Pre-primary to
 * Class 12 range at creation and nothing could ever narrow it, so every tutor
 * in the directory advertised every class — untrue on a public profile, and
 * useless for matching, since a signal that every teacher matches cannot tell
 * any two of them apart.
 *
 * The delicate half is the blank case: an unanswered set of checkboxes must not
 * wipe a range staff narrowed by hand.
 */
class TeacherGradesSyncTest extends TestCase
{
    use RefreshDatabase;

    private function teacher(array $profile = []): TeacherProfile
    {
        $user = User::factory()->create(['role' => 'teacher']);

        return TeacherProfile::create($profile + [
            'user_id'       => $user->id,
            'subjects'      => 'Mathematics',
            'teaching_mode' => 'online',
            'status'        => 'approved',
        ]);
    }

    public function test_stated_classes_reach_the_public_listing(): void
    {
        $profile = $this->teacher(['grades' => 'Class 9, Class 10']);

        TeacherProfilePublisher::publish($profile);

        $this->assertSame('Class 9, Class 10', $profile->user->fresh()->tutor->grades);
    }

    public function test_a_new_listing_still_starts_with_the_full_range(): void
    {
        // Nothing stated: the seeded range is better than an empty one, because
        // a tutor matching no class at all is invisible to every grade search.
        $profile = $this->teacher();

        TeacherProfilePublisher::publish($profile);

        $this->assertStringContainsString('Class 12', $profile->user->fresh()->tutor->grades);
    }

    public function test_leaving_the_field_blank_does_not_wipe_a_range_staff_narrowed(): void
    {
        $profile = $this->teacher(['grades' => 'Class 9, Class 10']);
        TeacherProfilePublisher::publish($profile);

        $tutor = $profile->user->fresh()->tutor;
        $tutor->update(['grades' => 'Class 11, Class 12']);   // staff correction

        // Teacher saves the form again having never touched the checkboxes.
        $profile->update(['grades' => '']);
        TeacherProfilePublisher::publish($profile->fresh());

        $this->assertSame('Class 11, Class 12', $tutor->fresh()->grades,
            'An unanswered checkbox set must read as "not stated", not as "teaches nothing".');
    }

    public function test_republishing_pushes_a_changed_range(): void
    {
        $profile = $this->teacher(['grades' => 'Class 9']);
        TeacherProfilePublisher::publish($profile);

        $profile->update(['grades' => 'Class 9, Class 10, Class 11']);
        TeacherProfilePublisher::publish($profile->fresh());

        $this->assertSame('Class 9, Class 10, Class 11', $profile->user->fresh()->tutor->grades);
    }

    /** The whole point of the field: it has to change who gets suggested. */
    public function test_a_narrowed_range_changes_the_suggestions(): void
    {
        $profile = $this->teacher(['grades' => 'Class 9, Class 10']);
        TeacherProfilePublisher::publish($profile);
        $profile->user->fresh()->tutor->update(['is_published' => true]);

        $forNine = \App\Support\TutorMatcher::rank(Tutor::published()->get(), 'Mathematics', '9', null, false);
        $forFive = \App\Support\TutorMatcher::rank(Tutor::published()->get(), 'Mathematics', '5', null, false);

        $this->assertContains('grade', $forNine->first()['why']);
        // Still eligible — they do teach Maths — but no longer claiming Class 5.
        $this->assertNotContains('grade', $forFive->first()['why']);
    }
}
