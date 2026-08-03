<?php
namespace Tests\Feature;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Review;
use App\Models\Student;
use App\Models\Tutor;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

// Course reviews (public submission → moderation → publication) and the
// self-service account endpoints that back the Account page.
class ReviewsAndAccountTest extends TestCase
{
    use RefreshDatabase;

    private Course $course;
    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->course = Course::create(['name' => 'Class 10 Maths', 'slug' => 'class-10-maths']);
        $this->admin  = User::factory()->create(['role' => 'admin']);
    }

    // --- Reviews ---

    public function test_a_submitted_review_is_held_for_moderation_and_is_not_public(): void
    {
        $this->postJson("/api/courses/{$this->course->slug}/reviews", [
            'author_name' => 'Meera', 'rating' => 5, 'body' => 'Brilliant teacher.',
        ])->assertCreated();

        $this->assertDatabaseHas('reviews', ['author_name' => 'Meera', 'status' => 'pending']);

        // Nothing a visitor writes appears until staff approve it.
        $this->getJson("/api/courses/{$this->course->slug}/reviews")
            ->assertOk()->assertJsonCount(0, 'data')
            ->assertJsonPath('summary.rating_count', 0);
    }

    public function test_approving_a_review_publishes_it_and_moves_the_average(): void
    {
        $review = Review::create([
            'course_id' => $this->course->id, 'author_name' => 'Meera', 'rating' => 4,
            'body' => 'Good', 'status' => 'pending',
        ]);

        Sanctum::actingAs($this->admin);
        $this->patchJson("/api/admin/reviews/{$review->id}", ['status' => 'approved'])->assertOk();

        $public = $this->getJson("/api/courses/{$this->course->slug}/reviews")
            ->assertOk()->assertJsonCount(1, 'data')
            ->assertJsonPath('summary.rating_count', 1);
        // Loose compare: a whole average serialises as 4, not 4.0.
        $this->assertEquals(4, $public->json('summary.rating_avg'));

        $this->assertDatabaseHas('audit_logs', ['action' => 'review_status', 'object_id' => $review->id]);
    }

    public function test_unpublishing_returns_a_review_to_the_queue_rather_than_deleting_it(): void
    {
        $review = Review::create([
            'course_id' => $this->course->id, 'author_name' => 'Meera', 'rating' => 5, 'status' => 'approved',
        ]);

        Sanctum::actingAs($this->admin);
        $this->patchJson("/api/admin/reviews/{$review->id}", ['status' => 'pending'])->assertOk();

        $this->assertDatabaseHas('reviews', ['id' => $review->id, 'status' => 'pending']);
        $this->getJson("/api/courses/{$this->course->slug}/reviews")->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_rating_must_be_between_one_and_five(): void
    {
        foreach ([0, 6, -1] as $rating) {
            $this->postJson("/api/courses/{$this->course->slug}/reviews", [
                'author_name' => 'X', 'rating' => $rating, 'body' => 'x',
            ])->assertStatus(422);
        }
    }

    public function test_reviewer_emails_are_never_exposed_publicly(): void
    {
        Review::create([
            'course_id' => $this->course->id, 'author_name' => 'Meera', 'author_email' => 'meera@x.test',
            'rating' => 5, 'body' => 'Great', 'status' => 'approved',
        ]);

        $this->getJson("/api/courses/{$this->course->slug}/reviews")
            ->assertOk()->assertJsonMissing(['author_email' => 'meera@x.test']);

        Sanctum::actingAs($this->admin);
        $this->getJson('/api/admin/reviews')->assertOk()->assertJsonPath('data.0.author_email', 'meera@x.test');
    }

    public function test_review_moderation_refuses_a_non_admin(): void
    {
        $review = Review::create(['course_id' => $this->course->id, 'author_name' => 'M', 'rating' => 5]);
        Sanctum::actingAs(User::factory()->create(['role' => 'parent']));

        $this->getJson('/api/admin/reviews')->assertForbidden();
        $this->patchJson("/api/admin/reviews/{$review->id}", ['status' => 'approved'])->assertForbidden();
        $this->deleteJson("/api/admin/reviews/{$review->id}")->assertForbidden();
    }

    // --- Account self-service ---

    public function test_a_user_can_rename_themselves_but_not_change_their_login_email(): void
    {
        $user = User::factory()->create(['role' => 'parent', 'email' => 'keep@x.test']);
        Sanctum::actingAs($user);

        $this->putJson('/api/auth/me', ['name' => 'New Name', 'email' => 'hijack@x.test', 'phone' => '9000000000'])
            ->assertOk()->assertJsonPath('data.name', 'New Name');

        // Email verification is deferred, so the login identifier is not editable.
        $this->assertDatabaseHas('users', ['id' => $user->id, 'name' => 'New Name', 'email' => 'keep@x.test']);
    }

    public function test_changing_a_password_requires_the_current_one_and_signs_out_other_devices(): void
    {
        $user = User::factory()->create(['role' => 'parent', 'password' => 'old-password-1']);
        $stale = $user->createToken('other-device')->accessToken;
        Sanctum::actingAs($user);

        $this->postJson('/api/auth/password', ['current_password' => 'wrong', 'password' => 'new-password-1'])
            ->assertStatus(422);

        $this->postJson('/api/auth/password', ['current_password' => 'old-password-1', 'password' => 'new-password-1'])
            ->assertOk();

        $this->assertDatabaseMissing('personal_access_tokens', ['id' => $stale->id]);
        $this->assertTrue(\Illuminate\Support\Facades\Hash::check('new-password-1', $user->fresh()->password));
    }

    public function test_my_orders_returns_only_the_callers_own_orders(): void
    {
        $mine   = User::factory()->create(['role' => 'parent']);
        $theirs = User::factory()->create(['role' => 'parent']);
        $order  = $mine->orders()->create(['first_name' => 'Me', 'email' => $mine->email, 'address_1' => 'a', 'city' => 'Kolkata', 'total' => 750]);
        $theirs->orders()->create(['first_name' => 'Them', 'email' => $theirs->email, 'address_1' => 'b', 'city' => 'Delhi', 'total' => 999]);

        Sanctum::actingAs($mine);
        $rows = $this->getJson('/api/my/orders')->assertOk()->json('data');

        $this->assertCount(1, $rows);
        $this->assertSame($order->id, $rows[0]['id']);
        $this->assertEquals(750, $rows[0]['total']);
    }

    // --- Student accounts see their own data ---

    public function test_a_linked_student_account_sees_its_own_enrollment_and_portfolio(): void
    {
        $parent  = User::factory()->create(['role' => 'parent']);
        $account = User::factory()->create(['role' => 'student']);
        $student = Student::create(['user_id' => $parent->id, 'account_user_id' => $account->id, 'name' => 'Ananya']);
        $tutor   = Tutor::create(['name' => 'T', 'slug' => 't-1']);
        $enrollment = Enrollment::create(['student_id' => $student->id, 'tutor_id' => $tutor->id, 'status' => 'active']);

        Sanctum::actingAs($account);
        $this->getJson('/api/my/enrollments')->assertOk()->assertJsonCount(1, 'data');
        $this->getJson("/api/my/enrollments/{$enrollment->id}")->assertOk();
        $this->getJson("/api/students/{$student->id}/portfolio")->assertOk();

        // /me carries the profile id so the dashboard knows which portfolio to show.
        $this->getJson('/api/auth/me')->assertOk()->assertJsonPath('data.student_profile.id', $student->id);
    }

    public function test_an_unlinked_student_account_still_cannot_reach_someone_elses_child(): void
    {
        $parent  = User::factory()->create(['role' => 'parent']);
        $student = Student::create(['user_id' => $parent->id, 'name' => 'Ananya']);   // account_user_id is null
        $tutor   = Tutor::create(['name' => 'T', 'slug' => 't-2']);
        $enrollment = Enrollment::create(['student_id' => $student->id, 'tutor_id' => $tutor->id, 'status' => 'active']);

        Sanctum::actingAs(User::factory()->create(['role' => 'student']));
        $this->getJson('/api/my/enrollments')->assertOk()->assertJsonCount(0, 'data');
        $this->getJson("/api/my/enrollments/{$enrollment->id}")->assertForbidden();
        $this->getJson("/api/students/{$student->id}/portfolio")->assertForbidden();
    }

    public function test_a_parent_still_sees_their_own_childs_enrollment(): void
    {
        $parent  = User::factory()->create(['role' => 'parent']);
        $student = Student::create(['user_id' => $parent->id, 'name' => 'Ananya']);
        $tutor   = Tutor::create(['name' => 'T', 'slug' => 't-3']);
        $enrollment = Enrollment::create(['student_id' => $student->id, 'tutor_id' => $tutor->id, 'status' => 'active']);

        Sanctum::actingAs($parent);
        $this->getJson('/api/my/enrollments')->assertOk()->assertJsonCount(1, 'data');
        $this->getJson("/api/my/enrollments/{$enrollment->id}")->assertOk();
    }
}
