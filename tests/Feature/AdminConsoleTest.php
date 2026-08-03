<?php
namespace Tests\Feature;

use App\Models\Course;
use App\Models\DemoRequest;
use App\Models\Order;
use App\Models\Review;
use App\Models\Student;
use App\Models\TeacherApplication;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

// The console's list endpoints: what each tab reads, and that none of them are
// reachable without an admin token.
class AdminConsoleTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $parent;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin  = User::factory()->create(['role' => 'admin']);
        $this->parent = User::factory()->create(['role' => 'parent']);
    }

    public function test_overview_reports_tiles_counts_and_what_needs_attention(): void
    {
        TeacherApplication::create(['name' => 'A', 'email' => 'a@x.test', 'phone' => '1', 'status' => 'pending']);
        TeacherApplication::create(['name' => 'B', 'email' => 'b@x.test', 'phone' => '2', 'status' => 'reviewing']);
        TeacherApplication::create(['name' => 'C', 'email' => 'c@x.test', 'phone' => '3', 'status' => 'approved']);
        Student::create(['user_id' => $this->parent->id, 'name' => 'Kid']);

        Sanctum::actingAs($this->admin);
        $res = $this->getJson('/api/admin/overview')->assertOk();

        // "Awaiting review" is pending + reviewing — an application someone has
        // opened but not decided is still waiting on staff.
        $res->assertJsonPath('data.tiles.applications_awaiting', 2)
            ->assertJsonPath('data.tiles.teacher_applications', 3)
            ->assertJsonPath('data.tiles.students', 1)
            ->assertJsonPath('data.needs_attention.applications_awaiting', 2)
            ->assertJsonStructure(['data' => [
                'tiles'   => ['teacher_applications', 'applications_awaiting', 'bookings_this_month', 'orders_this_month', 'parents', 'students', 'teachers', 'courses'],
                'counts'  => ['teachers', 'students', 'bookings', 'orders', 'reviews', 'courses', 'users', 'audit'],
                'needs_attention' => ['applications_awaiting', 'reviews_pending', 'bookings_new'],
            ]]);
    }

    public function test_teachers_console_merges_profiles_with_unclaimed_applications(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher', 'email' => 'known@x.test']);
        $teacher->teacherProfile()->create(['status' => 'approved', 'subjects' => 'Maths, Physics']);
        // Same person, applied before registering — must not appear twice.
        TeacherApplication::create(['name' => 'Known', 'email' => 'known@x.test', 'phone' => '1', 'status' => 'approved']);
        TeacherApplication::create(['name' => 'Stranger', 'email' => 'new@x.test', 'phone' => '2', 'status' => 'pending', 'subjects' => ['Chess']]);

        Sanctum::actingAs($this->admin);
        $rows = $this->getJson('/api/admin/teachers-console')->assertOk()->json('data');

        $this->assertCount(2, $rows);
        $this->assertSame(['application', 'profile'], collect($rows)->pluck('kind')->sort()->values()->all());
        $this->assertSame(['Chess'], collect($rows)->firstWhere('kind', 'application')['subjects']);
        // The comma string on a profile and the JSON array on an application
        // both arrive as a list.
        $this->assertSame(['Maths', 'Physics'], collect($rows)->firstWhere('kind', 'profile')['subjects']);
    }

    public function test_teachers_console_filters_by_status(): void
    {
        TeacherApplication::create(['name' => 'P', 'email' => 'p@x.test', 'phone' => '1', 'status' => 'pending']);
        TeacherApplication::create(['name' => 'R', 'email' => 'r@x.test', 'phone' => '2', 'status' => 'rejected']);

        Sanctum::actingAs($this->admin);
        $rows = $this->getJson('/api/admin/teachers-console?status=pending')->assertOk()->json('data');

        $this->assertCount(1, $rows);
        $this->assertSame('P', $rows[0]['name']);
    }

    public function test_students_list_carries_code_and_parent(): void
    {
        Student::create(['user_id' => $this->parent->id, 'name' => 'Ananya', 'subjects' => 'Maths, Hindi']);

        Sanctum::actingAs($this->admin);
        $row = $this->getJson('/api/admin/students')->assertOk()->json('data.0');

        $this->assertStringStartsWith('STU-', $row['code']);
        $this->assertSame($this->parent->name, $row['parent']['name']);
        $this->assertSame(2, $row['subjects_count']);
        $this->assertNull($row['account_user_id']);
    }

    public function test_admin_course_list_includes_drafts_that_the_public_catalogue_hides(): void
    {
        Course::create(['name' => 'Live', 'slug' => 'live', 'is_published' => true]);
        Course::create(['name' => 'Draft', 'slug' => 'draft', 'is_published' => false]);

        $this->getJson('/api/courses')->assertOk()
            ->assertJsonMissing(['name' => 'Draft']);

        Sanctum::actingAs($this->admin);
        $names = collect($this->getJson('/api/admin/courses')->assertOk()->json('data'))->pluck('name');
        $this->assertTrue($names->contains('Draft'), 'An admin must be able to see a draft in order to publish it.');
    }

    public function test_bookings_filter_by_type_and_month(): void
    {
        // created_at is not fillable, so it is set after the insert rather than
        // through create() — which would silently stamp "now" instead.
        $mk = function (string $type, $when) {
            $r = DemoRequest::create([
                'name' => $type, 'email' => "{$type}@x.test", 'phone' => '9', 'type' => $type, 'status' => 'new',
            ]);
            $r->created_at = $when;
            $r->save();
        };
        $mk('demo', now());
        $mk('workshop', now());
        $mk('free', now()->subMonths(2));

        Sanctum::actingAs($this->admin);
        $this->getJson('/api/admin/demo-requests?type=workshop')->assertOk()->assertJsonCount(1, 'data');
        $this->getJson('/api/admin/demo-requests?month=' . now()->format('Y-m'))->assertOk()->assertJsonCount(2, 'data');
        // A malformed month is ignored rather than returning nothing.
        $this->getJson('/api/admin/demo-requests?month=nonsense')->assertOk()->assertJsonCount(3, 'data');
    }

    public function test_audit_log_lists_and_filters_by_object_type(): void
    {
        Sanctum::actingAs($this->admin);
        $this->patchJson("/api/admin/users/{$this->parent->id}/role", ['role' => 'teacher'])->assertOk();

        $this->assertDatabaseHas('audit_logs', ['action' => 'role_changed', 'object_type' => 'user']);
        $this->getJson('/api/admin/audit?type=user')->assertOk()->assertJsonPath('data.0.action', 'role_changed');
        $this->getJson('/api/admin/audit?type=order')->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_google_review_url_setting_round_trips(): void
    {
        Sanctum::actingAs($this->admin);
        $this->putJson('/api/admin/settings', ['google_review_url' => 'https://g.page/r/abc/review'])->assertOk();
        $this->getJson('/api/admin/settings')
            ->assertOk()->assertJsonPath('data.google_review_url', 'https://g.page/r/abc/review');

        $this->putJson('/api/admin/settings', ['google_review_url' => 'not-a-url'])->assertStatus(422);
    }

    public function test_a_paid_order_cannot_be_deleted(): void
    {
        $order = Order::create([
            'first_name' => 'B', 'email' => 'b@x.test', 'address_1' => 'x', 'city' => 'Kolkata',
            'total' => 500, 'status' => 'paid',
        ]);

        Sanctum::actingAs($this->admin);
        // It is the record behind any course access it granted; cancelling is
        // the reversible path.
        $this->deleteJson("/api/admin/orders/{$order->id}")->assertStatus(422);
        $this->assertDatabaseHas('orders', ['id' => $order->id]);

        $order->update(['status' => 'pending']);
        $this->deleteJson("/api/admin/orders/{$order->id}")->assertOk();
        $this->assertDatabaseMissing('orders', ['id' => $order->id]);
    }

    public function test_every_console_endpoint_refuses_a_non_admin(): void
    {
        Sanctum::actingAs($this->parent);
        foreach ([
            '/api/admin/overview', '/api/admin/teachers-console', '/api/admin/students',
            '/api/admin/courses', '/api/admin/reviews', '/api/admin/audit', '/api/admin/settings',
        ] as $path) {
            $this->getJson($path)->assertForbidden();
        }
    }

    public function test_console_endpoints_refuse_an_anonymous_caller(): void
    {
        $this->getJson('/api/admin/overview')->assertUnauthorized();
    }
}
