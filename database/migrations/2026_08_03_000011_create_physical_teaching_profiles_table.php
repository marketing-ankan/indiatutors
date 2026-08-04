<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// The teacher's side of physical / home tuition — everything an external
// matching engine needs to decide "can this teacher reach this student, teach
// this subject at this grade, at a time they are both free, at a price the
// family accepts, and would the family accept them".
//
// A separate table rather than more columns on `teacher_profiles` because the
// two answer different questions: teacher_profiles is the marketing profile
// (headline, bio, fee) shown on the site; this is the operational record the
// matcher consumes, and it has to exist BEFORE the teacher has an account —
// the public "Become a Teacher" form captures it. Hence two nullable owners:
//   user_id                — a signed-in teacher editing their own profile
//   teacher_application_id — a public applicant, before an account exists
// Exactly one is set. Approving an application later sets user_id on the same
// row, so no data is copied and nothing drifts out of sync.
return new class extends Migration {
    public function up(): void {
        if (Schema::hasTable('physical_teaching_profiles')) return;
        Schema::create('physical_teaching_profiles', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->nullable()->unique()->constrained()->cascadeOnDelete();
            $t->foreignId('teacher_application_id')->nullable()->unique()
                ->constrained('teacher_applications')->cascadeOnDelete();

            // --- Identity (matters to families choosing who enters their home) ---
            $t->string('gender', 12)->nullable();              // female | male | other | undisclosed
            $t->date('date_of_birth')->nullable();
            $t->string('nationality', 60)->default('Indian');
            $t->string('languages', 300)->nullable();          // CSV — the medium they can actually teach in

            // --- Home base ---
            $t->string('address_line1', 190)->nullable();
            $t->string('address_line2', 190)->nullable();
            $t->string('landmark', 190)->nullable();
            $t->string('locality', 120)->nullable();
            $t->string('city', 120)->nullable();
            $t->string('district', 120)->nullable();
            $t->string('state', 120)->nullable();
            $t->string('pincode', 6)->nullable();
            $t->string('country', 60)->default('India');
            // The centre of the service circle. Captured from the browser's
            // geolocation when the teacher allows it (exact, free, no map key),
            // otherwise the pincode centroid.
            $t->decimal('latitude', 10, 7)->nullable();
            $t->decimal('longitude', 10, 7)->nullable();
            $t->string('geo_source', 12)->nullable();          // device | pincode | approx | manual
            $t->unsignedInteger('geo_accuracy_m')->nullable();

            // --- Travel ---
            $t->unsignedSmallInteger('service_radius_km')->default(0);   // 0 = does not travel
            $t->string('extra_pincodes', 400)->nullable();     // CSV opt-ins outside the circle (a metro line, a school run)
            $t->string('travel_mode', 20)->nullable();         // walk | cycle | two_wheeler | car | public
            // Minutes beat kilometres inside a city — 10 km in Bengaluru is not
            // 10 km in Bhopal — so we capture both and let the matcher choose.
            $t->unsignedSmallInteger('max_travel_minutes')->nullable();
            $t->boolean('travel_outside_city')->default(false);
            $t->decimal('travel_fee_per_visit', 8, 2)->nullable();

            // --- Where the class happens ---
            $t->boolean('at_student_home')->default(true);
            $t->boolean('at_own_place')->default(false);
            $t->boolean('at_public_place')->default(false);    // library / study centre / institute
            $t->unsignedTinyInteger('own_place_capacity')->nullable();

            // --- Capacity & scheduling reality ---
            $t->unsignedTinyInteger('max_students')->nullable();
            $t->unsignedTinyInteger('max_hours_per_week')->nullable();
            $t->unsignedSmallInteger('preferred_session_minutes')->nullable();
            $t->unsignedSmallInteger('notice_hours')->nullable();        // lead time before a first class
            $t->date('available_from')->nullable();
            $t->date('on_break_until')->nullable();

            // --- Who they will teach ---
            $t->string('preferred_student_gender', 12)->default('any');  // any | female | male
            $t->boolean('teaches_group')->default(false);
            $t->unsignedTinyInteger('max_batch_size')->nullable();
            $t->boolean('special_needs_experience')->default(false);

            // Per-subject pricing lives on the offerings; these are the floor the
            // matcher can filter on without joining.
            $t->decimal('min_fee_hourly', 8, 2)->nullable();
            $t->decimal('min_fee_monthly', 10, 2)->nullable();

            // --- Trust signals (ranking, not filtering) ---
            $t->boolean('police_verified')->default(false);
            $t->date('police_verified_on')->nullable();
            $t->unsignedTinyInteger('experience_years')->nullable();

            $t->text('notes')->nullable();
            $t->string('status', 20)->default('draft');        // draft | submitted | active | paused
            $t->timestamp('submitted_at')->nullable();
            $t->timestamps();

            $t->index('pincode');
            $t->index('status');
            $t->index(['state', 'district']);
            // The export API pages by updated_at — the external matcher asks
            // "what changed since my last sync" rather than re-reading everything.
            $t->index('updated_at');
        });
    }

    public function down(): void { Schema::dropIfExists('physical_teaching_profiles'); }
};
