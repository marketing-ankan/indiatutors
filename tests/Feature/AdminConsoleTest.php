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

    /**
     * The Overview prints "Nothing waiting on staff right now" in green
     * whenever every needs_attention counter is zero. Four queues were absent
     * from that list, so an unanswered family could be sitting behind the
     * reassurance that there was nothing to answer. Each counter here is a
     * person waiting; a missing one is worse than a wrong number, because a
     * wrong number is at least visible.
     */
    public function test_every_queue_a_person_is_waiting_in_reaches_the_overview(): void
    {
        \App\Models\SupportTicket::create([
            'name' => 'Asha', 'email' => 'asha@x.test', 'subject' => 'Refund',
            'source' => 'website', 'category' => 'billing', 'status' => 'open',
        ]);
        \App\Models\ContactMessage::create([
            'name' => 'Rohit', 'email' => 'rohit@x.test', 'message' => 'Do you teach Chemistry?',
        ]);
        \App\Models\TuitionRequirement::create([
            'name' => 'Meera', 'phone' => '9000000000', 'subject' => 'Physics',
            'city' => 'Pune', 'status' => 'open',
        ]);

        Sanctum::actingAs($this->admin);
        $res = $this->getJson('/api/admin/overview')->assertOk();

        $res->assertJsonPath('data.needs_attention.support_open', 1)
            ->assertJsonPath('data.needs_attention.messages_new', 1)
            ->assertJsonPath('data.needs_attention.requirements_open', 1);
    }

    /**
     * A booking with a teacher on it but no date. It has left the "new" queue,
     * so every other counter treats it as handled while the family waits for a
     * time that was never set — the one stall nothing was watching.
     */
    public function test_a_booking_assigned_without_a_date_is_flagged(): void
    {
        $tutor = \App\Models\Tutor::create(['name' => 'T', 'slug' => 't-' . uniqid(), 'is_published' => true]);

        $stalled = DemoRequest::create([
            'name' => 'Waiting', 'email' => 'w@x.test', 'phone' => '1', 'subject' => 'Physics',
            'status' => 'contacted', 'assigned_tutor_id' => $tutor->id, 'scheduled_at' => null,
        ]);
        // Dated: nobody is waiting on staff for this one.
        DemoRequest::create([
            'name' => 'Booked', 'email' => 'b@x.test', 'phone' => '2', 'subject' => 'Physics',
            'status' => 'scheduled', 'assigned_tutor_id' => $tutor->id, 'scheduled_at' => now()->addDay(),
        ]);
        // Every terminal status is legitimately dateless. Asserted one by one,
        // because the first version of this counter excluded a "cancelled"
        // status that does not exist in DemoRequest::STATUSES, which left
        // converted, no_show and closed bookings raising a false alarm.
        foreach (['completed', 'converted', 'no_show', 'closed'] as $i => $done) {
            DemoRequest::create([
                'name' => 'Done ' . $done, 'email' => "d{$i}@x.test", 'phone' => '3', 'subject' => 'Physics',
                'status' => $done, 'assigned_tutor_id' => $tutor->id, 'scheduled_at' => null,
            ]);
        }

        Sanctum::actingAs($this->admin);
        $this->getJson('/api/admin/overview')->assertOk()
            ->assertJsonPath('data.needs_attention.demos_unscheduled', 1);

        // ...and it clears once a date is set, or the flag would never go away.
        $stalled->update(['scheduled_at' => now()->addDays(2), 'status' => 'scheduled']);
        $this->getJson('/api/admin/overview')->assertOk()
            ->assertJsonPath('data.needs_attention.demos_unscheduled', 0);
    }
    /**
     * The console heading and the console shortlist must read one booking the
     * same way.
     *
     * BookingsTab labels a row `course?.name || subject`, so a family who picked
     * a course and left the free-text subject empty is displayed under the
     * course name — while the shortlist was matching on the empty subject and
     * offering either nobody or, worse, everybody.
     */
    public function test_the_shortlist_reads_the_booking_the_way_the_console_labels_it(): void
    {
        $course = Course::create([
            'name' => 'Carnatic Vocal Music', 'slug' => 'carnatic-vocal-music-' . uniqid(),
            'regular_price' => 1000, 'is_published' => true,
        ]);
        $singer = \App\Models\Tutor::create([
            'name' => 'Vijaya', 'slug' => 'vijaya-' . uniqid(), 'is_published' => true,
            'subjects' => 'Vocal Music, Carnatic Vocals', 'teaching_mode' => 'online',
        ]);
        \App\Models\Tutor::create([
            'name' => 'Pianist', 'slug' => 'pianist-' . uniqid(), 'is_published' => true,
            'subjects' => 'Piano, Music Theory', 'teaching_mode' => 'online',
        ]);

        $booking = DemoRequest::create([
            'name' => 'Asha', 'email' => 'asha@x.test', 'phone' => '9',
            'subject' => null, 'course_id' => $course->id, 'status' => 'new',
        ]);

        Sanctum::actingAs($this->admin);
        $res = $this->getJson("/api/admin/demo-requests/{$booking->id}/suggestions")->assertOk();

        $this->assertSame(1, $res->json('meta.count'), 'The pianist is not a vocal teacher.');
        $this->assertSame($singer->id, $res->json('data.0.id'));
    }

    /**
     * A booking with no subject AND no course tells us nothing about what the
     * family wants, so it must suggest nobody rather than the whole roster.
     */
    public function test_a_booking_with_nothing_to_match_on_suggests_nobody(): void
    {
        foreach ([['Yoga person', 'Yoga'], ['Drummer', 'Drums'], ['Singer', 'Vocal Music']] as [$n, $subj]) {
            \App\Models\Tutor::create([
                'name' => $n, 'slug' => strtolower($n) . '-' . uniqid(), 'is_published' => true,
                'subjects' => $subj, 'grades' => '1-12', 'teaching_mode' => 'online',
            ]);
        }

        $booking = DemoRequest::create([
            'name' => 'Asha', 'email' => 'asha@x.test', 'phone' => '9',
            'subject' => null, 'grade' => 'Class 9', 'status' => 'new',
        ]);

        Sanctum::actingAs($this->admin);
        $this->getJson("/api/admin/demo-requests/{$booking->id}/suggestions")->assertOk()
            ->assertJsonPath('meta.count', 0);
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
