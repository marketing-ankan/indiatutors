<?php
namespace Tests\Feature;

use App\Models\PhysicalTeachingProfile;
use App\Models\Pincode;
use App\Models\TuitionRequirement;
use App\Models\User;
use App\Support\Availability;
use App\Support\GradeScale;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Physical / home-tuition capture, and the export the leads-management software
 * reads.
 *
 * This system does not match anybody, so there is no matching to test. What
 * there is instead — and what these tests guard — is the contract: every field
 * the leads software filters or ranks on must survive capture, normalisation
 * and export. A field silently dropped here fails nowhere in this codebase; it
 * fails as an unexplainable bad assignment in a different one.
 */
class PhysicalTuitionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // No network in tests: the India Post fallback must never be reached.
        config(['services.pincode.lookup_api' => false]);

        Pincode::insert([
            ['pincode' => '700156', 'district' => 'North 24 Parganas', 'state' => 'West Bengal',
             'latitude' => 22.5820, 'longitude' => 88.4750, 'localities' => json_encode(['New Town']), 'source' => 'seed'],
            ['pincode' => '700091', 'district' => 'Kolkata', 'state' => 'West Bengal',
             'latitude' => 22.5760, 'longitude' => 88.4310, 'localities' => json_encode(['Salt Lake Sector V']), 'source' => 'seed'],
            ['pincode' => '110001', 'district' => 'New Delhi', 'state' => 'Delhi',
             'latitude' => 28.6330, 'longitude' => 77.2190, 'localities' => json_encode(['Connaught Place']), 'source' => 'seed'],
        ]);
    }

    // ------------------------------------------------------------ unit-ish

    public function test_grades_normalise_to_one_ordinal_scale(): void
    {
        $this->assertSame(10, GradeScale::parse('Class 10'));
        $this->assertSame(10, GradeScale::parse('10th'));
        $this->assertSame(10, GradeScale::parse('X'));
        $this->assertSame(0,  GradeScale::parse('Nursery'));
        $this->assertSame(13, GradeScale::parse('College'));
        $this->assertNull(GradeScale::parse('somewhere'));
    }

    /** The apply form paints an hour grid; the matcher needs merged ranges. */
    public function test_availability_hour_grid_becomes_merged_ranges(): void
    {
        $slots = Availability::normalize(['Mon' => [17, 18, 19], 'Sat' => [10, 12]]);

        $this->assertEquals([
            ['weekday' => 1, 'start_time' => '17:00:00', 'end_time' => '20:00:00'],
            ['weekday' => 6, 'start_time' => '10:00:00', 'end_time' => '11:00:00'],
            ['weekday' => 6, 'start_time' => '12:00:00', 'end_time' => '13:00:00'],
        ], $slots);
    }

    /**
     * A summary of one record, never a comparison between two — this system
     * does not intersect a teacher's slots with a family's preferred times.
     */
    public function test_weekly_hours_sums_a_teachers_own_slots(): void
    {
        $this->assertSame(5.0, Availability::weeklyHours(
            Availability::normalize(['Mon' => [17, 18, 19], 'Tue' => [17, 18]])
        ));
        $this->assertSame(0.0, Availability::weeklyHours([]));
    }

    // ------------------------------------------------------------ capture

    public function test_teacher_saves_a_profile_and_the_pincode_fills_in_the_geography(): void
    {
        Sanctum::actingAs($this->teacher());

        $res = $this->putJson('/api/teacher/physical-profile', [
            'address_line1' => 'AA Block', 'city' => 'Kolkata', 'pincode' => '700156',
            'service_radius_km' => 8, 'travel_mode' => 'two_wheeler',
            'languages' => 'English, Bengali',
            'offerings' => [[
                'subject' => 'Mathematics', 'grade_from' => 9, 'grade_to' => 12,
                'boards' => ['CBSE'], 'fee_hourly' => 600,
            ]],
            'availability' => ['Mon' => [17, 18, 19]],
            'publish' => true,
        ])->assertOk();

        $res->assertJsonPath('data.status', 'active')
            ->assertJsonPath('data.district', 'North 24 Parganas')   // never typed by the teacher
            ->assertJsonPath('data.state', 'West Bengal')
            ->assertJsonPath('data.geo_source', 'pincode')
            ->assertJsonPath('data.availability.0.start_time', '17:00')
            ->assertJsonPath('data.availability.0.end_time', '20:00');

        $this->assertSame(22.582, (float) $res->json('data.latitude'));
        // 90, not 100: this request left gender blank, which the meter counts
        // because families filter on it.
        $this->assertSame(90, $res->json('data.completeness'));
    }

    /** A browser GPS fix is exact and free — a pincode centroid must not overwrite it. */
    public function test_a_device_fix_survives_the_pincode_backfill(): void
    {
        Sanctum::actingAs($this->teacher());

        $this->putJson('/api/teacher/physical-profile', [
            'pincode' => '700156', 'latitude' => 22.6001, 'longitude' => 88.4900,
            'geo_source' => 'device', 'geo_accuracy_m' => 12,
        ])->assertOk()
          ->assertJsonPath('data.geo_source', 'device')
          ->assertJsonPath('data.latitude', 22.6001);
    }

    /**
     * Regression: the form loads the profile, then posts it back untouched.
     * Columns that are NOT NULL with a default arrive as null on that round
     * trip, and writing the null used to 500 the save.
     */
    public function test_saving_a_profile_round_tripped_from_the_api_does_not_null_its_defaults(): void
    {
        Sanctum::actingAs($this->teacher());

        $loaded = $this->getJson('/api/teacher/physical-profile')->assertOk()->json('data');
        $this->assertSame('Indian', $loaded['nationality']);   // the default must survive the read

        // Echo the whole document back, exactly as the client would.
        $this->putJson('/api/teacher/physical-profile', $loaded + ['pincode' => '700156'])->assertOk()
            ->assertJsonPath('data.nationality', 'Indian')
            ->assertJsonPath('data.country', 'India');
    }

    public function test_a_guest_can_post_a_requirement_and_gets_a_quotable_code(): void
    {
        $res = $this->postJson('/api/tuition-requirements', [
            'contact_name' => 'Sunita', 'contact_phone' => '9800000000',
            'grade' => 10, 'board' => 'CBSE', 'subjects' => ['Mathematics'],
            'pincode' => '700091', 'venue_preference' => 'student_home',
        ])->assertCreated();

        $id = $res->json('data.id');
        $this->assertSame('REQ-' . (100000 + $id), TuitionRequirement::find($id)->code);
        $res->assertJsonPath('data.district', 'Kolkata');   // autofilled
    }

    /**
     * `exists:students,id` proves the id is real, not that it is yours. Without
     * the guest guard, anyone could point a lead at another family's child —
     * and the export dereferences that FK, so the child's name and code would
     * ride out to the leads software inside a stranger's record.
     */
    public function test_a_guest_cannot_attach_someone_elses_student_to_a_requirement(): void
    {
        $parent  = User::factory()->create(['role' => 'parent']);
        $student = \App\Models\Student::create(['user_id' => $parent->id, 'name' => 'Someone Elses Child']);

        $res = $this->postJson('/api/tuition-requirements', [
            'contact_name' => 'Stranger', 'contact_phone' => '9800000000',
            'student_id' => $student->id, 'subjects' => ['Mathematics'], 'pincode' => '700091',
        ])->assertCreated();

        $this->assertNull(TuitionRequirement::find($res->json('data.id'))->student_id);
    }

    public function test_a_requirement_needs_a_pincode_and_a_subject(): void
    {
        $this->postJson('/api/tuition-requirements', [
            'contact_name' => 'Sunita', 'contact_phone' => '9800000000',
        ])->assertStatus(422)->assertJsonValidationErrors(['pincode', 'subjects']);
    }

    /** The public apply form's physical block lands in the matching tables, not a copy. */
    public function test_an_application_creates_the_same_physical_profile_the_dashboard_edits(): void
    {
        $this->postJson('/api/teacher-applications', [
            'name' => 'Asha Rao', 'email' => 'asha@example.test', 'phone' => '9811111111',
            'terms' => true,
            'physical' => json_encode([
                'pincode' => '700156', 'service_radius_km' => 6, 'at_student_home' => true,
                'offerings' => [['subject' => 'Physics', 'grade_from' => 11, 'grade_to' => 12]],
                'availability' => ['Tue' => [16, 17]],
            ]),
        ])->assertCreated();

        $profile = PhysicalTeachingProfile::first();
        $this->assertNotNull($profile->teacher_application_id);
        $this->assertNull($profile->user_id);
        $this->assertSame('submitted', $profile->status);
        $this->assertSame('Physics', $profile->offerings->first()->subject);

        // Registering with the same email claims that row rather than starting blank.
        $teacher = User::factory()->create(['role' => 'teacher', 'email' => 'asha@example.test']);
        Sanctum::actingAs($teacher);
        $this->getJson('/api/teacher/physical-profile')->assertOk()->assertJsonPath('data.id', $profile->id);
        $this->assertSame($teacher->id, $profile->fresh()->user_id);
    }

    // ------------------------------------------------------------ console

    /**
     * The console reads and triages. It must NOT be able to assign a teacher —
     * that decision belongs to the leads software, and a second writer for it
     * would be a second source of truth.
     */
    public function test_staff_can_triage_a_request_but_not_assign_a_teacher(): void
    {
        $profile = $this->publishedTeacher();
        $req     = $this->requirement();
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        $this->patchJson("/api/admin/physical/requirements/{$req->id}", [
            'status' => 'on_hold', 'notes' => 'Family travelling until October.',
        ])->assertOk()->assertJsonPath('data.status', 'on_hold');

        // Silently ignored, not accepted: the field is not in the console's rules.
        $this->patchJson("/api/admin/physical/requirements/{$req->id}", [
            'matched_profile_id' => $profile->id,
        ])->assertOk();

        $this->assertNull($req->fresh()->matched_profile_id);
    }

    /** There is no candidate/suggestion endpoint on this system at all. */
    public function test_the_console_exposes_no_match_suggestion_endpoint(): void
    {
        $req = $this->requirement();
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        $this->getJson("/api/admin/physical/requirements/{$req->id}/matches")->assertStatus(404);
    }

    // ------------------------------------------------------------ export

    public function test_the_export_refuses_to_answer_without_a_configured_key(): void
    {
        config(['services.matching.key' => null]);
        $this->getJson('/api/matching/v1/teachers')->assertStatus(503);
    }

    public function test_the_export_rejects_a_wrong_key(): void
    {
        config(['services.matching.key' => 'right-key']);
        $this->getJson('/api/matching/v1/teachers')->assertStatus(401);
        $this->withHeader('X-Matching-Key', 'wrong-key')
            ->getJson('/api/matching/v1/teachers')->assertStatus(401);
    }

    public function test_the_export_ships_flat_resolved_teacher_records(): void
    {
        config(['services.matching.key' => 'right-key']);
        $this->publishedTeacher();

        $res = $this->withHeader('X-Matching-Key', 'right-key')
            ->getJson('/api/matching/v1/teachers')->assertOk();

        $res->assertJsonPath('data.0.location.district', 'North 24 Parganas')
            ->assertJsonPath('data.0.location.geo_source', 'pincode')
            ->assertJsonPath('data.0.service_area.radius_km', 8)
            ->assertJsonPath('data.0.service_area.venues.0', 'student_home')
            ->assertJsonPath('data.0.teaches.0.grade_from', 9)
            ->assertJsonPath('data.0.availability.weekly.0.weekday', 1)
            ->assertJsonPath('data.0.availability.weekly_hours', 3)
            ->assertJsonPath('data.0.person.languages.1', 'Bengali');

        $this->assertStringStartsWith('teacher:', $res->json('data.0.id'));
        $this->assertNotNull($res->json('meta.checkpoint'));
    }

    /**
     * The requirement export is the whole reason this module exists: if a field
     * a family filled in does not reach the leads software, it may as well not
     * have been asked for. Every group in the contract doc is asserted here.
     */
    public function test_the_export_ships_every_captured_requirement_field(): void
    {
        config(['services.matching.key' => 'k']);
        $this->requirement([
            'school' => 'DPS Newtown', 'goal' => 'board_exam', 'sessions_per_week' => 3,
            'session_minutes' => 90, 'urgency' => 'within_week', 'learner_count' => 2,
            'preferred_teacher_languages' => ['Bengali'], 'min_teacher_experience' => 3,
            'best_time_to_call' => 'after 6pm', 'whatsapp_consent' => true,
        ]);

        $res = $this->withHeader('X-Matching-Key', 'k')
            ->getJson('/api/matching/v1/requirements')->assertOk();

        $res->assertJsonPath('data.0.contact.phone', '9800000000')
            ->assertJsonPath('data.0.contact.best_time_to_call', 'after 6pm')
            ->assertJsonPath('data.0.learner.grade', 10)
            ->assertJsonPath('data.0.learner.grade_label', 'Class 10')
            ->assertJsonPath('data.0.learner.board', 'CBSE')
            ->assertJsonPath('data.0.learner.school', 'DPS Newtown')
            ->assertJsonPath('data.0.learner.count', 2)
            ->assertJsonPath('data.0.needs.subjects.0', 'Mathematics')
            ->assertJsonPath('data.0.needs.goal', 'board_exam')
            ->assertJsonPath('data.0.needs.sessions_per_week', 3)
            ->assertJsonPath('data.0.needs.urgency', 'within_week')
            ->assertJsonPath('data.0.location.pincode', '700091')
            ->assertJsonPath('data.0.location.geo_source', 'pincode')
            ->assertJsonPath('data.0.location.venue_preference', 'student_home')
            ->assertJsonPath('data.0.location.max_teacher_distance_km', 10)
            ->assertJsonPath('data.0.schedule.preferred_days.0', 1)
            ->assertJsonPath('data.0.schedule.preferred_time_windows.0.start', '17:00')
            ->assertJsonPath('data.0.teacher_preferences.languages.0', 'Bengali')
            ->assertJsonPath('data.0.teacher_preferences.min_experience', 3);

        $this->assertNotNull($res->json('data.0.location.latitude'));
        $this->assertStringStartsWith('requirement:', $res->json('data.0.id'));
    }

    /** Drafts must never reach the leads software — they fail every filter and look like a bug. */
    public function test_the_export_only_ships_active_profiles_by_default(): void
    {
        config(['services.matching.key' => 'k']);
        $this->publishedTeacher()->update(['status' => 'draft']);

        $this->withHeader('X-Matching-Key', 'k')
            ->getJson('/api/matching/v1/teachers')->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_the_assignment_app_can_write_a_match_back(): void
    {
        config(['services.matching.key' => 'k']);
        $profile = $this->publishedTeacher();
        $req     = $this->requirement();

        $this->withHeader('X-Matching-Key', 'k')
            ->patchJson("/api/matching/v1/requirements/{$req->id}", ['matched_profile_id' => $profile->id])
            ->assertOk()->assertJsonPath('data.status', 'matched');

        $this->assertSame($profile->id, $req->fresh()->matched_profile_id);
        $this->assertNotNull($req->fresh()->matched_at);
    }

    // ------------------------------------------------------------ helpers

    private function teacher(): User
    {
        return User::factory()->create(['role' => 'teacher']);
    }

    private function publishedTeacher(array $overrides = []): PhysicalTeachingProfile
    {
        $profile = PhysicalTeachingProfile::create([
            'user_id' => $this->teacher()->id,
            'status' => 'active', 'gender' => 'female', 'languages' => 'English, Bengali',
            'city' => 'Kolkata', 'district' => 'North 24 Parganas', 'state' => 'West Bengal',
            'pincode' => '700156', 'latitude' => 22.5820, 'longitude' => 88.4750, 'geo_source' => 'pincode',
            'service_radius_km' => 8, 'travel_mode' => 'two_wheeler',
            'at_student_home' => true, 'experience_years' => 7, 'preferred_student_gender' => 'any',
            ...$overrides,
        ]);
        $profile->offerings()->create([
            'subject' => 'Mathematics', 'grade_from' => 9, 'grade_to' => 12,
            'boards' => ['CBSE', 'ICSE'], 'fee_hourly' => 600,
        ]);
        foreach (Availability::normalize(['Mon' => [17, 18, 19]]) as $slot) {
            $profile->slots()->create($slot);
        }

        return $profile;
    }

    private function requirement(array $overrides = []): TuitionRequirement
    {
        return TuitionRequirement::create([
            'contact_name' => 'Sunita', 'contact_phone' => '9800000000',
            'learner_gender' => 'female', 'grade' => 10, 'board' => 'CBSE',
            'subjects' => ['Mathematics'], 'medium' => 'English',
            'pincode' => '700091', 'city' => 'Kolkata', 'district' => 'Kolkata', 'state' => 'West Bengal',
            'latitude' => 22.5760, 'longitude' => 88.4310, 'geo_source' => 'pincode',
            'venue_preference' => 'student_home', 'max_teacher_distance_km' => 10,
            'preferred_days' => [1], 'preferred_time_windows' => [['start' => '17:00', 'end' => '19:00']],
            'budget_max_hourly' => 700, 'preferred_teacher_gender' => 'any',
            ...$overrides,
        ]);
    }
}
