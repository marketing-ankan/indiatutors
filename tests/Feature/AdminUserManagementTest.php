<?php
namespace Tests\Feature;

use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

// Account creation, deletion and the read-only "view dashboard". These are the
// endpoints that can lock everyone out or hand out access, so the guards get
// more attention here than the happy paths.
class AdminUserManagementTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($this->admin);
    }

    public function test_admin_creates_an_account_and_it_is_audited(): void
    {
        $this->postJson('/api/admin/users', [
            'name' => 'New Parent', 'email' => 'np@x.test', 'password' => 'a-long-password', 'role' => 'parent',
        ])->assertCreated()->assertJsonPath('data.role', 'parent');

        $this->assertDatabaseHas('users', ['email' => 'np@x.test', 'role' => 'parent']);
        $this->assertDatabaseHas('audit_logs', ['action' => 'user_added', 'object_type' => 'user']);
    }

    public function test_creating_another_admin_needs_explicit_confirmation(): void
    {
        $this->postJson('/api/admin/users', [
            'name' => 'Sneaky', 'email' => 'sneaky@x.test', 'password' => 'a-long-password', 'role' => 'admin',
        ])->assertStatus(422);
        $this->assertDatabaseMissing('users', ['email' => 'sneaky@x.test']);

        $this->postJson('/api/admin/users', [
            'name' => 'Deliberate', 'email' => 'ok@x.test', 'password' => 'a-long-password',
            'role' => 'admin', 'confirm_admin' => true,
        ])->assertCreated();
    }

    public function test_a_short_password_is_rejected_and_none_is_ever_generated(): void
    {
        $this->postJson('/api/admin/users', [
            'name' => 'X', 'email' => 'x@x.test', 'role' => 'parent', 'password' => 'short',
        ])->assertStatus(422);

        // No password at all must also fail — the endpoint never invents one.
        $this->postJson('/api/admin/users', [
            'name' => 'X', 'email' => 'x@x.test', 'role' => 'parent',
        ])->assertStatus(422);
    }

    public function test_student_account_is_linked_to_the_parents_existing_child(): void
    {
        $parent  = User::factory()->create(['role' => 'parent']);
        $student = Student::create(['user_id' => $parent->id, 'name' => 'Ananya', 'grade' => '8']);

        $res = $this->postJson('/api/admin/users/student', [
            'parent_user_id' => $parent->id, 'student_id' => $student->id,
            'name' => 'Ananya', 'email' => 'ananya@x.test', 'password' => 'a-long-password',
        ])->assertCreated();

        $account = User::where('email', 'ananya@x.test')->firstOrFail();
        $this->assertSame('student', $account->role);
        // The guardian keeps user_id; the child's own login is account_user_id.
        $this->assertDatabaseHas('students', [
            'id' => $student->id, 'user_id' => $parent->id, 'account_user_id' => $account->id,
        ]);
        $this->assertStringStartsWith('STU-', $res->json('data.student.code'));
    }

    public function test_student_account_creates_a_profile_when_none_is_named(): void
    {
        $parent = User::factory()->create(['role' => 'parent']);

        $this->postJson('/api/admin/users/student', [
            'parent_user_id' => $parent->id, 'name' => 'Rohan',
            'email' => 'rohan@x.test', 'password' => 'a-long-password', 'grade' => '6',
        ])->assertCreated();

        $this->assertDatabaseHas('students', ['name' => 'Rohan', 'user_id' => $parent->id, 'grade' => '6']);
    }

    public function test_student_account_refuses_a_child_of_a_different_parent(): void
    {
        $parentA = User::factory()->create(['role' => 'parent']);
        $parentB = User::factory()->create(['role' => 'parent']);
        $student = Student::create(['user_id' => $parentA->id, 'name' => 'Ananya']);

        $this->postJson('/api/admin/users/student', [
            'parent_user_id' => $parentB->id, 'student_id' => $student->id,
            'name' => 'Ananya', 'email' => 'a2@x.test', 'password' => 'a-long-password',
        ])->assertStatus(422);
    }

    public function test_deleting_a_guardian_needs_confirmation_because_children_cascade(): void
    {
        $parent = User::factory()->create(['role' => 'parent']);
        Student::create(['user_id' => $parent->id, 'name' => 'Kid One']);
        Student::create(['user_id' => $parent->id, 'name' => 'Kid Two']);

        $this->deleteJson("/api/admin/users/{$parent->id}")
            ->assertStatus(409)
            ->assertJsonPath('students', 2)
            ->assertJsonPath('requires_confirmation', true);
        $this->assertDatabaseHas('users', ['id' => $parent->id]);

        $this->deleteJson("/api/admin/users/{$parent->id}", ['confirm' => true])->assertOk();
        $this->assertDatabaseMissing('users', ['id' => $parent->id]);
        $this->assertDatabaseHas('audit_logs', ['action' => 'user_deleted', 'object_id' => $parent->id]);
    }

    public function test_an_admin_cannot_delete_themselves_or_the_last_admin(): void
    {
        $this->deleteJson("/api/admin/users/{$this->admin->id}")->assertStatus(422);
        $this->assertDatabaseHas('users', ['id' => $this->admin->id]);

        // A second admin deleting the first is fine; the last one standing is not.
        $other = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($other);
        $this->deleteJson("/api/admin/users/{$this->admin->id}")->assertOk();
        $this->deleteJson("/api/admin/users/{$other->id}")->assertStatus(422);
    }

    public function test_view_dashboard_returns_a_snapshot_and_never_a_token(): void
    {
        $parent = User::factory()->create(['role' => 'parent']);
        Student::create(['user_id' => $parent->id, 'name' => 'Ananya', 'subjects' => 'Maths']);

        $res = $this->getJson("/api/admin/users/{$parent->id}/dashboard")->assertOk();

        $res->assertJsonPath('data.user.email', $parent->email)
            ->assertJsonPath('data.students.0.name', 'Ananya')
            ->assertJsonStructure(['data' => ['user', 'students', 'enrollments', 'orders', 'bookings', 'video_courses']]);

        // Read-only by construction: no credential of any kind comes back.
        $body = $res->getContent();
        $this->assertStringNotContainsString('token', strtolower($body));
        $this->assertDatabaseHas('audit_logs', ['action' => 'user_viewed', 'object_id' => $parent->id]);
    }

    public function test_role_change_still_refuses_self_demotion_and_the_last_admin(): void
    {
        $this->patchJson("/api/admin/users/{$this->admin->id}/role", ['role' => 'parent'])->assertStatus(422);

        $other = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($other);
        $this->patchJson("/api/admin/users/{$this->admin->id}/role", ['role' => 'parent'])->assertOk();
        // Only one admin left — it must not be demotable.
        $this->patchJson("/api/admin/users/{$other->id}/role", ['role' => 'parent'])->assertStatus(422);
    }

    public function test_customer_filter_returns_accounts_that_have_ordered(): void
    {
        $buyer = User::factory()->create(['role' => 'parent']);
        User::factory()->create(['role' => 'parent']);
        $buyer->orders()->create([
            'first_name' => 'B', 'email' => $buyer->email, 'address_1' => 'x', 'city' => 'Kolkata', 'total' => 100,
        ]);

        $rows = $this->getJson('/api/admin/users?role=customer')->assertOk()->json('data');
        $this->assertCount(1, $rows);
        $this->assertSame($buyer->id, $rows[0]['id']);
    }

    public function test_user_management_refuses_a_non_admin(): void
    {
        $parent = User::factory()->create(['role' => 'parent']);
        Sanctum::actingAs($parent);

        $this->postJson('/api/admin/users', ['name' => 'X', 'email' => 'y@x.test', 'password' => 'a-long-password', 'role' => 'admin'])
            ->assertForbidden();
        $this->getJson("/api/admin/users/{$this->admin->id}/dashboard")->assertForbidden();
        $this->deleteJson("/api/admin/users/{$this->admin->id}")->assertForbidden();
    }
}
