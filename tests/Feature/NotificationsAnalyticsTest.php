<?php
namespace Tests\Feature;

use App\Models\AppNotification;
use App\Models\Enrollment;
use App\Models\RescheduleRequest;
use App\Models\Student;
use App\Models\Tutor;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class NotificationsAnalyticsTest extends TestCase
{
    use RefreshDatabase;

    private User $teacher;
    private Tutor $tutor;
    private User $parent;
    private Enrollment $enrollment;

    protected function setUp(): void
    {
        parent::setUp();
        $this->teacher = User::factory()->create(['role' => 'teacher']);
        $this->teacher->teacherProfile()->create(['status' => 'approved']);
        $this->tutor = Tutor::create(['user_id' => $this->teacher->id, 'name' => 'T', 'slug' => 't']);
        $this->parent = User::factory()->create(['role' => 'parent']);
        $student = Student::create(['user_id' => $this->parent->id, 'name' => 'Ananya']);
        $this->enrollment = Enrollment::create([
            'student_id' => $student->id, 'tutor_id' => $this->tutor->id, 'status' => 'active',
        ]);
    }

    // --- Reschedules (Phase 8) ---

    public function test_parent_requests_reschedule_and_teacher_gets_notified(): void
    {
        Sanctum::actingAs($this->parent);
        $this->postJson("/api/my/enrollments/{$this->enrollment->id}/reschedules", [
            'preferred_date' => now()->addDays(3)->toDateString(), 'reason' => 'Travelling',
        ])->assertCreated()->assertJsonPath('data.status', 'pending');

        $this->assertDatabaseHas('app_notifications', [
            'user_id' => $this->teacher->id, 'type' => 'reschedule_requested',
        ]);
    }

    public function test_stranger_cannot_request_reschedule(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'parent']));
        $this->postJson("/api/my/enrollments/{$this->enrollment->id}/reschedules", [])->assertForbidden();
    }

    public function test_teacher_decides_reschedule_and_parent_gets_notified(): void
    {
        $r = RescheduleRequest::create([
            'enrollment_id' => $this->enrollment->id, 'requested_by' => $this->parent->id, 'status' => 'pending',
        ]);

        Sanctum::actingAs($this->teacher);
        $this->getJson('/api/teacher/reschedules')->assertOk()->assertJsonCount(1, 'data');
        $this->patchJson("/api/teacher/reschedules/{$r->id}", ['status' => 'accepted'])
            ->assertOk()->assertJsonPath('data.status', 'accepted');

        $this->assertDatabaseHas('app_notifications', [
            'user_id' => $this->parent->id, 'type' => 'reschedule_decided',
        ]);
    }

    public function test_other_teacher_cannot_decide_reschedule(): void
    {
        $r = RescheduleRequest::create([
            'enrollment_id' => $this->enrollment->id, 'requested_by' => $this->parent->id, 'status' => 'pending',
        ]);
        $other = User::factory()->create(['role' => 'teacher']);
        Tutor::create(['user_id' => $other->id, 'name' => 'O', 'slug' => 'o']);
        Sanctum::actingAs($other);
        $this->patchJson("/api/teacher/reschedules/{$r->id}", ['status' => 'accepted'])->assertForbidden();
    }

    // --- Notifications feed ---

    public function test_notifications_are_scoped_and_markable(): void
    {
        AppNotification::send($this->parent->id, 'enrolled', 'Enrollment confirmed');
        AppNotification::send($this->teacher->id, 'teacher_approved', 'Approved');

        Sanctum::actingAs($this->parent);
        $res = $this->getJson('/api/notifications')->assertOk();
        $this->assertSame(1, $res->json('unread'));
        $this->assertCount(1, $res->json('data')); // only their own
        $id = $res->json('data.0.id');

        $this->patchJson("/api/notifications/{$id}/read")->assertOk();
        $this->assertSame(0, $this->getJson('/api/notifications')->json('unread'));
    }

    public function test_cannot_mark_someone_elses_notification(): void
    {
        AppNotification::send($this->teacher->id, 'x', 'X');
        $id = AppNotification::where('user_id', $this->teacher->id)->value('id');
        Sanctum::actingAs($this->parent);
        $this->patchJson("/api/notifications/{$id}/read")->assertNotFound();
    }

    // --- Analytics (Phase 9) ---

    public function test_analytics_returns_totals_and_trends_for_admin(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
        $res = $this->getJson('/api/admin/analytics')->assertOk();
        $data = $res->json('data');

        $this->assertSame(1, $data['totals']['parents']);
        $this->assertSame(1, $data['totals']['teachers']);
        $this->assertArrayHasKey('parents', $data['totals']);
        $this->assertArrayHasKey('enrollments_active', $data['totals']);
        $this->assertSame(1, $data['totals']['enrollments_active']);
        $this->assertCount(6, $data['trend']['demos']);
        $this->assertArrayHasKey('demos_by_city', $data);
    }

    public function test_analytics_is_admin_only(): void
    {
        Sanctum::actingAs($this->teacher);
        $this->getJson('/api/admin/analytics')->assertForbidden();
    }
}
