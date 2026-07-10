<?php
namespace Tests\Feature;

use App\Models\ClassMaterial;
use App\Models\CourseProposal;
use App\Models\Enrollment;
use App\Models\Student;
use App\Models\Tutor;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CurriculumMaterialsTest extends TestCase
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

    // --- Curriculum ---

    public function test_teacher_defines_and_updates_curriculum(): void
    {
        Sanctum::actingAs($this->teacher);
        $res = $this->postJson("/api/teacher/enrollments/{$this->enrollment->id}/curriculum", [
            'topic' => 'Kinematics', 'details' => 'Motion in one dimension',
        ])->assertCreated();
        $id = $res->json('data.id');

        $this->patchJson("/api/teacher/enrollments/{$this->enrollment->id}/curriculum/{$id}", ['status' => 'done'])
            ->assertOk()->assertJsonPath('data.status', 'done');

        $this->getJson("/api/teacher/enrollments/{$this->enrollment->id}/curriculum")
            ->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_other_teacher_cannot_touch_curriculum(): void
    {
        $other = User::factory()->create(['role' => 'teacher']);
        Tutor::create(['user_id' => $other->id, 'name' => 'O', 'slug' => 'o']);
        Sanctum::actingAs($other);
        $this->postJson("/api/teacher/enrollments/{$this->enrollment->id}/curriculum", ['topic' => 'X'])
            ->assertForbidden();
    }

    // --- Materials ---

    public function test_teacher_uploads_material_and_parent_downloads_it(): void
    {
        Storage::fake('local');
        Sanctum::actingAs($this->teacher);
        $res = $this->postJson("/api/teacher/enrollments/{$this->enrollment->id}/materials", [
            'type' => 'note', 'title' => 'Chapter 1 notes',
            'file' => UploadedFile::fake()->create('notes.pdf', 120, 'application/pdf'),
        ])->assertCreated()->assertJsonPath('data.has_file', true);
        $id = $res->json('data.id');

        // Parent can download
        Sanctum::actingAs($this->parent);
        $this->get("/api/materials/{$id}/download")->assertOk();
    }

    public function test_stranger_cannot_download_material(): void
    {
        Storage::fake('local');
        $material = ClassMaterial::create([
            'enrollment_id' => $this->enrollment->id, 'tutor_id' => $this->tutor->id,
            'type' => 'note', 'title' => 'N', 'path' => UploadedFile::fake()->create('n.pdf', 10)->store('materials/x', 'local'),
        ]);
        Sanctum::actingAs(User::factory()->create(['role' => 'parent'])); // unrelated parent
        $this->getJson("/api/materials/{$material->id}/download")->assertForbidden();
    }

    public function test_material_requires_file_or_link(): void
    {
        Sanctum::actingAs($this->teacher);
        $this->postJson("/api/teacher/enrollments/{$this->enrollment->id}/materials", [
            'type' => 'note', 'title' => 'Empty',
        ])->assertStatus(422);
    }

    // --- Parent portal ---

    public function test_parent_sees_full_enrollment_detail(): void
    {
        $this->enrollment->curriculumItems()->create(['topic' => 'Algebra', 'position' => 1]);
        $this->enrollment->classLogs()->create(['tutor_id' => $this->tutor->id, 'topic' => 'Intro', 'held_on' => '2026-07-01']);
        $this->enrollment->materials()->create(['tutor_id' => $this->tutor->id, 'type' => 'note', 'title' => 'N1', 'link_url' => 'https://example.com/n1']);

        Sanctum::actingAs($this->parent);
        $this->getJson("/api/my/enrollments/{$this->enrollment->id}")
            ->assertOk()
            ->assertJsonPath('data.teacher.name', 'T')
            ->assertJsonCount(1, 'data.curriculum')
            ->assertJsonCount(1, 'data.classes')
            ->assertJsonCount(1, 'data.materials');
    }

    public function test_other_parent_cannot_see_enrollment_detail(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'parent']));
        $this->getJson("/api/my/enrollments/{$this->enrollment->id}")->assertForbidden();
    }

    // --- Course proposals ---

    public function test_teacher_proposes_and_admin_approval_adds_subject(): void
    {
        $this->tutor->update(['subjects' => 'Physics']);
        Sanctum::actingAs($this->teacher);
        $res = $this->postJson('/api/teacher/proposals', ['title' => 'Astronomy', 'description' => 'Night-sky basics'])
            ->assertCreated();
        $id = $res->json('data.id');

        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
        $this->patchJson("/api/admin/proposals/{$id}", ['status' => 'approved'])
            ->assertOk()->assertJsonPath('data.status', 'approved');

        $this->assertSame('Physics, Astronomy', $this->tutor->fresh()->subjects);
    }

    public function test_non_teacher_cannot_propose(): void
    {
        Sanctum::actingAs($this->parent);
        $this->postJson('/api/teacher/proposals', ['title' => 'X'])->assertForbidden();
    }
}
