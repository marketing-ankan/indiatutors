<?php
namespace Tests\Feature;

use App\Models\ClassLog;
use App\Models\DemoRequest;
use App\Models\Enrollment;
use App\Models\Student;
use App\Models\TeacherProfile;
use App\Models\Tutor;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TeacherClassroomTest extends TestCase
{
    use RefreshDatabase;

    private function teacher(array $attrs = []): User
    {
        $user = User::factory()->create(['role' => 'teacher'] + $attrs);
        $user->teacherProfile()->create(['status' => 'pending', 'subjects' => 'Maths', 'city' => 'Kolkata']);
        return $user;
    }

    /** A student owned by a fresh parent account. */
    private function studentNamed(string $name): Student
    {
        $parent = User::factory()->create(['role' => 'parent']);
        return Student::create(['user_id' => $parent->id, 'name' => $name]);
    }

    /** Approving a teacher creates a listed directory tutor linked to their account. */
    public function test_approval_creates_a_linked_directory_tutor(): void
    {
        $admin   = User::factory()->create(['role' => 'admin']);
        $teacher = $this->teacher(['name' => 'Asha Rao']);
        $profile = $teacher->teacherProfile;

        Sanctum::actingAs($admin);
        $this->patchJson("/api/admin/teachers/{$profile->id}", ['status' => 'approved'])
            ->assertOk()->assertJsonPath('data.status', 'approved');

        $tutor = Tutor::where('user_id', $teacher->id)->first();
        $this->assertNotNull($tutor, 'A directory tutor should be created on approval.');
        $this->assertTrue((bool) $tutor->is_published);
        $this->assertSame('Maths', $tutor->subjects);
    }

    /** Approval is idempotent — a second approve doesn't create a duplicate tutor. */
    public function test_approval_does_not_duplicate_the_tutor(): void
    {
        $admin   = User::factory()->create(['role' => 'admin']);
        $teacher = $this->teacher();
        $profile = $teacher->teacherProfile;

        Sanctum::actingAs($admin);
        $this->patchJson("/api/admin/teachers/{$profile->id}", ['status' => 'approved'])->assertOk();
        $this->patchJson("/api/admin/teachers/{$profile->id}", ['status' => 'approved'])->assertOk();

        $this->assertSame(1, Tutor::where('user_id', $teacher->id)->count());
    }

    public function test_pending_teacher_sees_an_empty_roster(): void
    {
        Sanctum::actingAs($this->teacher());
        $this->getJson('/api/teacher/students')->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_teacher_sees_only_their_own_enrollments(): void
    {
        $mine = $this->teacher();
        $myTutor = Tutor::create(['user_id' => $mine->id, 'name' => 'Mine', 'slug' => 'mine']);
        $s1 = $this->studentNamed('Ravi');
        Enrollment::create(['student_id' => $s1->id, 'tutor_id' => $myTutor->id, 'status' => 'active']);

        $otherTutor = Tutor::create(['name' => 'Other', 'slug' => 'other']);
        $s2 = $this->studentNamed('Priya');
        Enrollment::create(['student_id' => $s2->id, 'tutor_id' => $otherTutor->id, 'status' => 'active']);

        Sanctum::actingAs($mine);
        $this->getJson('/api/teacher/students')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.student', 'Ravi');
    }

    public function test_teacher_can_log_a_class_for_their_enrollment(): void
    {
        $teacher = $this->teacher();
        $tutor = Tutor::create(['user_id' => $teacher->id, 'name' => 'T', 'slug' => 't']);
        $student = $this->studentNamed('Ravi');
        $enr = Enrollment::create(['student_id' => $student->id, 'tutor_id' => $tutor->id, 'status' => 'active']);

        Sanctum::actingAs($teacher);
        $this->postJson("/api/teacher/enrollments/{$enr->id}/logs", [
            'topic' => 'Algebra basics', 'held_on' => '2026-07-09', 'duration_min' => 60, 'homework' => 'Ex 4.1',
        ])->assertCreated()->assertJsonPath('data.topic', 'Algebra basics');

        $this->assertDatabaseHas('class_logs', ['enrollment_id' => $enr->id, 'tutor_id' => $tutor->id, 'topic' => 'Algebra basics']);
    }

    public function test_teacher_cannot_log_a_class_for_another_teachers_enrollment(): void
    {
        $teacher = $this->teacher();
        Tutor::create(['user_id' => $teacher->id, 'name' => 'T', 'slug' => 't']);

        $otherTutor = Tutor::create(['name' => 'Other', 'slug' => 'other']);
        $student = $this->studentNamed('Priya');
        $enr = Enrollment::create(['student_id' => $student->id, 'tutor_id' => $otherTutor->id, 'status' => 'active']);

        Sanctum::actingAs($teacher);
        $this->postJson("/api/teacher/enrollments/{$enr->id}/logs", ['topic' => 'X', 'held_on' => '2026-07-09'])
            ->assertForbidden();
        $this->assertDatabaseCount('class_logs', 0);
    }

    public function test_non_teacher_cannot_access_the_teacher_roster(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'parent']));
        $this->getJson('/api/teacher/students')->assertForbidden();
    }

    /** An unauthenticated API request returns 401 JSON even without an Accept header (not 500). */
    public function test_unauthenticated_api_request_returns_401_not_500(): void
    {
        $this->get('/api/teacher/students') // plain GET, no Accept: application/json
            ->assertStatus(401)
            ->assertJson(['message' => 'Unauthenticated.']);
    }

    public function test_assigned_demos_are_returned_without_parent_pii(): void
    {
        $teacher = $this->teacher();
        $tutor = Tutor::create(['user_id' => $teacher->id, 'name' => 'T', 'slug' => 't']);
        DemoRequest::create([
            'name' => 'Parent', 'email' => 'parent@example.com', 'phone' => '9998887776',
            'subject' => 'Physics', 'assigned_tutor_id' => $tutor->id, 'status' => 'scheduled',
        ]);

        Sanctum::actingAs($teacher);
        $res = $this->getJson('/api/teacher/demos')->assertOk()->assertJsonCount(1, 'data');
        $row = $res->json('data.0');
        $this->assertSame('Physics', $row['subject']);
        $this->assertArrayNotHasKey('email', $row);
        $this->assertArrayNotHasKey('phone', $row);
    }
}
