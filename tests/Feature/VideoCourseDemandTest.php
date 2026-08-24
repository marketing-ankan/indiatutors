<?php
namespace Tests\Feature;

use App\Models\User;
use App\Models\VideoCourseRequest;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Demand capture for recorded courses that do not exist yet.
 *
 * The value of this feature is entirely in the AGGREGATE — nobody reads the
 * rows one at a time to decide what to record. So the tests that matter are
 * about counting honestly: that variants of the same request group together,
 * that a vote without contact details still counts, and that consent to be
 * emailed is never recorded for someone who left no email.
 */
class VideoCourseDemandTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_visitor_can_ask_for_a_subject_with_nothing_but_the_subject(): void
    {
        $this->postJson('/api/video-course-requests', ['subject' => 'Class 10 Physics'])
            ->assertCreated()
            ->assertJsonPath('data.subject', 'Class 10 Physics');

        $this->assertDatabaseHas('video_course_requests', [
            'subject'   => 'Class 10 Physics',
            'notify_me' => false,
            'status'    => 'new',
        ]);
    }

    public function test_the_subject_is_required_because_a_vote_for_nothing_is_not_a_vote(): void
    {
        $this->postJson('/api/video-course-requests', ['name' => 'Asha'])
            ->assertStatus(422)->assertJsonValidationErrors('subject');
    }

    /**
     * Free text is the point — a dropdown of what we already list would only
     * tell us what we already thought of — but free text scatters one subject
     * across many rows unless it is grouped on the way in.
     */
    public function test_variants_of_one_request_are_counted_as_one_subject(): void
    {
        foreach (['Class 10 Maths', 'class 10 math', 'Maths for class 10', 'MATHS'] as $typed) {
            $this->postJson('/api/video-course-requests', ['subject' => $typed])->assertCreated();
        }

        $keys = VideoCourseRequest::pluck('subject_key')->unique();
        $this->assertCount(1, $keys, 'All four are one request: ' . $keys->implode(' | '));
        $this->assertSame('math', $keys->first());
    }

    public function test_a_different_subject_is_not_merged_into_it(): void
    {
        $this->postJson('/api/video-course-requests', ['subject' => 'Class 10 Maths'])->assertCreated();
        $this->postJson('/api/video-course-requests', ['subject' => 'Class 10 Physics'])->assertCreated();

        $this->assertCount(2, VideoCourseRequest::pluck('subject_key')->unique());
    }

    /**
     * "Tell me when it launches" against no address would build a list that
     * cannot be delivered to, and would read later as a consent we never got.
     */
    public function test_asking_to_be_notified_without_an_email_is_not_recorded_as_consent(): void
    {
        $this->postJson('/api/video-course-requests', [
            'subject' => 'Spoken English', 'notify_me' => true,
        ])->assertCreated();

        $this->assertFalse(VideoCourseRequest::first()->notify_me);
    }

    public function test_asking_to_be_notified_with_an_email_is_recorded(): void
    {
        $this->postJson('/api/video-course-requests', [
            'subject' => 'Spoken English', 'email' => 'asha@example.test', 'notify_me' => true,
        ])->assertCreated();

        $this->assertTrue(VideoCourseRequest::first()->notify_me);
    }

    public function test_a_signed_in_person_is_linked_without_retyping_their_details(): void
    {
        $parent = User::factory()->create(['role' => 'parent', 'name' => 'Rohit', 'email' => 'rohit@example.test']);
        Sanctum::actingAs($parent);

        $this->postJson('/api/video-course-requests', ['subject' => 'Chemistry'])->assertCreated();

        $r = VideoCourseRequest::first();
        $this->assertSame($parent->id, $r->user_id);
        $this->assertSame('rohit@example.test', $r->email);
    }

    /**
     * Consent must be decided AFTER the account's email is filled in.
     *
     * Ordered the other way round — which is how this was first written — a
     * signed-in person who ticked "tell me when it launches" and did not retype
     * an address had the consent discarded: we hold their email, they asked to
     * be written to, and the flag still came out false. Caught by using the
     * form rather than by reading it.
     */
    public function test_a_signed_in_person_who_asks_to_be_told_is_recorded_as_wanting_it(): void
    {
        $parent = User::factory()->create(['role' => 'parent', 'email' => 'asha@example.test']);
        Sanctum::actingAs($parent);

        $this->postJson('/api/video-course-requests', [
            'subject' => 'Class 10 Physics', 'notify_me' => true,   // no email typed
        ])->assertCreated();

        $r = VideoCourseRequest::first();
        $this->assertTrue($r->notify_me, 'We have their address and they asked to be told.');
        $this->assertSame('asha@example.test', $r->email);
    }
    /**
     * The flag has to cross the public whitelist to be worth anything.
     *
     * SiteSettingController::index returns a hand-listed subset — adding a key
     * to SiteSettings::FIELDS does NOT publish it. Missing from that list, the
     * front end never saw the setting and sat permanently on its fallback,
     * which happens to be 'coming_soon' and so looked exactly like success.
     * Only flipping it to 'live' and seeing nothing change revealed it.
     */
    public function test_the_catalogue_status_reaches_the_front_end(): void
    {
        $this->getJson('/api/site-settings')->assertOk()
            ->assertJsonPath('data.video_courses_status', 'coming_soon');

        \App\Models\Setting::put('video_courses_status', 'live');

        $this->getJson('/api/site-settings')->assertOk()
            ->assertJsonPath('data.video_courses_status', 'live');
    }

    /** An unset or blank value must read as closed, never as on sale. */
    public function test_an_unset_status_defaults_to_closed(): void
    {
        \App\Models\Setting::put('video_courses_status', '');

        $this->getJson('/api/site-settings')->assertOk()
            ->assertJsonPath('data.video_courses_status', 'coming_soon');
    }
    public function test_the_report_ranks_subjects_by_how_many_people_asked(): void
    {
        foreach (['Physics', 'Physics', 'physics', 'Tabla'] as $s) {
            $this->postJson('/api/video-course-requests', ['subject' => $s])->assertCreated();
        }
        $this->postJson('/api/video-course-requests', [
            'subject' => 'Physics', 'email' => 'a@b.test', 'notify_me' => true,
        ])->assertCreated();

        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
        $res = $this->getJson('/api/admin/video-demand/insights')->assertOk();

        $res->assertJsonPath('data.total', 5)
            ->assertJsonPath('data.ranking.0.subject_key', 'physics')
            ->assertJsonPath('data.ranking.0.requests', 4)
            ->assertJsonPath('data.ranking.0.waiting_to_hear', 1)
            ->assertJsonPath('data.ranking.1.subject_key', 'tabla');

        // Staff should see the words a person typed, not the grouping key.
        $this->assertSame('Physics', $res->json('data.ranking.0.example'),
            'Staff should read the words a person typed, not the grouping key.');
    }

    public function test_the_report_and_the_list_are_staff_only(): void
    {
        $this->getJson('/api/admin/video-demand')->assertUnauthorized();
        $this->getJson('/api/admin/video-demand/insights')->assertUnauthorized();

        Sanctum::actingAs(User::factory()->create(['role' => 'parent']));
        $this->getJson('/api/admin/video-demand')->assertForbidden();
        $this->getJson('/api/admin/video-demand/insights')->assertForbidden();
    }

    /**
     * The one thing this must never do.
     *
     * Nobody is promised a reply here — it is a vote, not an enquiry. If it
     * counted as work outstanding, the Overview would show a permanent backlog
     * that no amount of staff effort could clear, and the queues that DO mean
     * somebody is waiting would stop being believed.
     */
    public function test_a_request_never_appears_as_work_waiting_on_staff(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/video-course-requests', ['subject' => "Subject {$i}"])->assertCreated();
        }

        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
        $need = $this->getJson('/api/admin/overview')->assertOk()->json('data.needs_attention');

        foreach ($need as $key => $count) {
            $this->assertSame(0, (int) $count, "Video demand leaked into needs_attention.{$key}");
        }
    }

    public function test_staff_can_move_a_request_through_its_own_statuses(): void
    {
        $this->postJson('/api/video-course-requests', ['subject' => 'Sitar'])->assertCreated();
        $id = VideoCourseRequest::first()->id;

        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
        $this->patchJson("/api/admin/video-demand/{$id}", ['status' => 'planned'])->assertOk();
        $this->assertSame('planned', VideoCourseRequest::find($id)->status);

        $this->patchJson("/api/admin/video-demand/{$id}", ['status' => 'nonsense'])
            ->assertStatus(422);
    }

    /**
     * "Coming soon" has to hold on the SERVER.
     *
     * It was enforced in the two React pages only, so POST /api/orders happily
     * accepted a video line while the catalogue said the course was not on
     * sale — minting a real order, a real invoice number and a signed invoice
     * URL for a recording that does not exist. A stale tab, a cached bundle or
     * anyone posting directly reaches that path.
     */
    public function test_the_server_refuses_to_sell_a_video_course_while_it_is_coming_soon(): void
    {
        \App\Models\Setting::put('video_courses_status', 'coming_soon');

        $v = \App\Models\VideoCourse::create([
            'title' => 'Class 10 Maths', 'slug' => 'class-10-maths-' . uniqid(),
            'price' => 999, 'is_published' => true,
        ]);

        $this->postJson('/api/orders', [
            'first_name' => 'Asha', 'email' => 'asha@example.test',
            'address_1' => '1 Park Street', 'city' => 'Kolkata',
            'items' => [['slug' => $v->slug, 'kind' => 'video']],
        ])->assertStatus(422);

        $this->assertDatabaseCount('orders', 0);
    }

    public function test_the_server_sells_it_once_the_catalogue_is_live(): void
    {
        \App\Models\Setting::put('video_courses_status', 'live');

        $v = \App\Models\VideoCourse::create([
            'title' => 'Class 10 Maths', 'slug' => 'class-10-maths-' . uniqid(),
            'price' => 999, 'is_published' => true,
        ]);

        $this->postJson('/api/orders', [
            'first_name' => 'Asha', 'email' => 'asha@example.test',
            'address_1' => '1 Park Street', 'city' => 'Kolkata',
            'items' => [['slug' => $v->slug, 'kind' => 'video']],
        ])->assertSuccessful();

        $this->assertDatabaseCount('orders', 1);
    }
}
