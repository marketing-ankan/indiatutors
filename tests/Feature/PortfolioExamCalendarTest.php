<?php
namespace Tests\Feature;

use App\Models\ClassLog;
use App\Models\Enrollment;
use App\Models\ExamUpdate;
use App\Models\Student;
use App\Models\Tutor;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PortfolioExamCalendarTest extends TestCase
{
    use RefreshDatabase;

    private User $teacher;
    private Tutor $tutor;
    private User $parent;
    private Student $student;
    private Enrollment $enrollment;

    protected function setUp(): void
    {
        parent::setUp();
        $this->teacher = User::factory()->create(['role' => 'teacher']);
        $this->teacher->teacherProfile()->create(['status' => 'approved']);
        $this->tutor = Tutor::create(['user_id' => $this->teacher->id, 'name' => 'T', 'slug' => 't']);
        $this->parent = User::factory()->create(['role' => 'parent']);
        $this->student = Student::create(['user_id' => $this->parent->id, 'name' => 'Ananya']);
        $this->enrollment = Enrollment::create([
            'student_id' => $this->student->id, 'tutor_id' => $this->tutor->id, 'status' => 'active',
        ]);
    }

    // --- Portfolio ---

    public function test_parent_adds_and_lists_portfolio_items(): void
    {
        Storage::fake('local');
        Sanctum::actingAs($this->parent);
        $this->postJson("/api/students/{$this->student->id}/portfolio", [
            'type' => 'certificate', 'title' => 'Piano Grade 1',
            'file' => UploadedFile::fake()->create('cert.pdf', 80, 'application/pdf'),
        ])->assertCreated()->assertJsonPath('data.has_file', true);

        $this->getJson("/api/students/{$this->student->id}/portfolio")
            ->assertOk()->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Piano Grade 1');
    }

    public function test_assigned_teacher_adds_item_and_parent_is_notified(): void
    {
        Sanctum::actingAs($this->teacher);
        $this->postJson("/api/students/{$this->student->id}/portfolio", [
            'type' => 'achievement', 'title' => 'Completed Kinematics module',
        ])->assertCreated();

        $this->assertDatabaseHas('app_notifications', [
            'user_id' => $this->parent->id, 'type' => 'portfolio_added',
        ]);
    }

    public function test_stranger_cannot_view_or_add_portfolio(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'parent']));
        $this->getJson("/api/students/{$this->student->id}/portfolio")->assertForbidden();
        $this->postJson("/api/students/{$this->student->id}/portfolio", ['type' => 'other', 'title' => 'X'])->assertForbidden();
    }

    public function test_parent_can_delete_item_teacher_added(): void
    {
        $item = $this->student->portfolioItems()->create(['added_by' => $this->teacher->id, 'type' => 'other', 'title' => 'Old']);
        Sanctum::actingAs($this->parent);
        $this->deleteJson("/api/portfolio/{$item->id}")->assertOk();
        $this->assertDatabaseMissing('portfolio_items', ['id' => $item->id]);
    }

    // --- Exam updates ---

    public function test_admin_publishes_update_and_parent_sees_only_published(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
        $this->postJson('/api/admin/exam-updates', [
            'title' => 'JEE Main 2027 registration opens', 'exam_date' => '2026-11-01',
        ])->assertCreated();
        $draftId = $this->postJson('/api/admin/exam-updates', [
            'title' => 'Draft note', 'is_published' => false,
        ])->json('data.id');

        Sanctum::actingAs($this->parent);
        $res = $this->getJson('/api/exam-updates')->assertOk()->assertJsonCount(1, 'data');
        $this->assertSame('JEE Main 2027 registration opens', $res->json('data.0.title'));

        // Draft invisible in the feed; admin sees both.
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
        $this->assertCount(2, $this->getJson('/api/admin/exam-updates')->json('data'));
        $this->assertIsInt($draftId);
    }

    public function test_non_admin_cannot_create_exam_updates(): void
    {
        Sanctum::actingAs($this->parent);
        $this->postJson('/api/admin/exam-updates', ['title' => 'X'])->assertForbidden();
    }

    // --- Parent upcoming classes ---

    public function test_parent_sees_only_their_upcoming_scheduled_classes(): void
    {
        ClassLog::create(['enrollment_id' => $this->enrollment->id, 'tutor_id' => $this->tutor->id, 'topic' => 'Mine soon', 'held_on' => now()->addDays(2), 'status' => 'scheduled']);
        ClassLog::create(['enrollment_id' => $this->enrollment->id, 'tutor_id' => $this->tutor->id, 'topic' => 'Already done', 'held_on' => now()->subDays(2), 'status' => 'completed']);

        $otherParent = User::factory()->create(['role' => 'parent']);
        $otherStudent = Student::create(['user_id' => $otherParent->id, 'name' => 'Ravi']);
        $otherEnrollment = Enrollment::create(['student_id' => $otherStudent->id, 'tutor_id' => $this->tutor->id, 'status' => 'active']);
        ClassLog::create(['enrollment_id' => $otherEnrollment->id, 'tutor_id' => $this->tutor->id, 'topic' => 'Not mine', 'held_on' => now()->addDays(3), 'status' => 'scheduled']);

        Sanctum::actingAs($this->parent);
        $res = $this->getJson('/api/my/upcoming-classes')->assertOk();
        $this->assertSame(['Mine soon'], array_column($res->json('data'), 'topic'));
    }

    // --- Teacher calendar ---

    public function test_calendar_returns_own_month_classes_and_demos_only(): void
    {
        $inMonth  = now()->startOfMonth()->addDays(9);
        $offMonth = now()->startOfMonth()->subDays(5);
        ClassLog::create(['enrollment_id' => $this->enrollment->id, 'tutor_id' => $this->tutor->id, 'topic' => 'In month', 'held_on' => $inMonth, 'status' => 'scheduled']);
        ClassLog::create(['enrollment_id' => $this->enrollment->id, 'tutor_id' => $this->tutor->id, 'topic' => 'Other month', 'held_on' => $offMonth, 'status' => 'completed']);

        // Another teacher's class must not leak in.
        $otherTeacher = User::factory()->create(['role' => 'teacher']);
        $otherTutor = Tutor::create(['user_id' => $otherTeacher->id, 'name' => 'O', 'slug' => 'o']);
        $otherEnrollment = Enrollment::create(['student_id' => $this->student->id, 'tutor_id' => $otherTutor->id, 'status' => 'active']);
        ClassLog::create(['enrollment_id' => $otherEnrollment->id, 'tutor_id' => $otherTutor->id, 'topic' => 'Not mine', 'held_on' => $inMonth, 'status' => 'scheduled']);

        Sanctum::actingAs($this->teacher);
        $res = $this->getJson('/api/teacher/calendar?month='.now()->format('Y-m'))->assertOk();
        $topics = array_column($res->json('data.classes'), 'topic');
        $this->assertSame(['In month'], $topics);
        $this->assertSame(now()->format('Y-m'), $res->json('data.month'));
    }
}
