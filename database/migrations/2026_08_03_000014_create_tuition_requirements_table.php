<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// The student's side of a physical-tuition match: one open requirement.
//
// Deliberately NOT columns on `students`. A family can have two live
// requirements at once (Class 10 Maths urgently, Class 7 Science from June),
// each with its own budget, timings and even address — a child at a
// grandparent's house on weekends is a normal Indian arrangement. A requirement
// is also the thing that opens, gets matched and closes; a student profile is
// permanent.
//
// Nullable student_id/user_id so the public "find me a home tutor" form can
// capture a requirement from a guest — the lead is the point, the account can
// follow.
return new class extends Migration {
    public function up(): void {
        if (Schema::hasTable('tuition_requirements')) return;
        Schema::create('tuition_requirements', function (Blueprint $t) {
            $t->id();
            $t->string('code', 20)->nullable()->unique();     // REQ-100042 — quotable on a call
            $t->foreignId('user_id')->nullable()->constrained()->nullOnDelete();      // guardian account
            $t->foreignId('student_id')->nullable()->constrained()->nullOnDelete();
            $t->foreignId('demo_request_id')->nullable()->constrained()->nullOnDelete();

            // --- Who to call ---
            $t->string('contact_name', 120)->nullable();
            $t->string('contact_phone', 30)->nullable();
            $t->string('contact_email', 190)->nullable();
            $t->string('relationship', 20)->nullable();       // parent | guardian | self
            $t->boolean('whatsapp_consent')->default(false);
            $t->string('best_time_to_call', 60)->nullable();

            // --- The learner ---
            $t->string('learner_name', 120)->nullable();
            $t->string('learner_gender', 12)->nullable();
            $t->date('learner_dob')->nullable();
            $t->unsignedTinyInteger('grade')->nullable();     // ordinal, same scale as teaching_offerings
            $t->string('board', 40)->nullable();
            $t->string('school', 190)->nullable();
            $t->string('medium', 60)->nullable();             // language they learn in
            $t->json('languages')->nullable();                // languages spoken at home
            $t->unsignedTinyInteger('learner_count')->default(1);   // siblings taught together

            // --- What they need ---
            $t->json('subjects')->nullable();                 // ["Mathematics","Science"]
            $t->string('goal', 30)->nullable();               // board_exam | competitive | remedial | homework | skill
            $t->string('exam_target', 120)->nullable();
            $t->text('focus_areas')->nullable();              // "weak in trigonometry"
            $t->boolean('special_needs')->default(false);
            $t->text('special_needs_note')->nullable();

            // --- Where ---
            $t->string('address_line1', 190)->nullable();
            $t->string('address_line2', 190)->nullable();
            $t->string('landmark', 190)->nullable();
            $t->string('locality', 120)->nullable();
            $t->string('city', 120)->nullable();
            $t->string('district', 120)->nullable();
            $t->string('state', 120)->nullable();
            $t->string('pincode', 6)->nullable();
            $t->string('country', 60)->default('India');
            $t->decimal('latitude', 10, 7)->nullable();
            $t->decimal('longitude', 10, 7)->nullable();
            $t->string('geo_source', 12)->nullable();
            $t->string('venue_preference', 20)->default('student_home');  // student_home | teacher_place | either
            // Two different distances: how far the family will let a teacher
            // travel to them (a proxy for "will this teacher actually keep
            // showing up in July rain"), and how far they will travel themselves
            // when the class is at the teacher's place.
            $t->unsignedSmallInteger('max_teacher_distance_km')->nullable();
            $t->unsignedSmallInteger('willing_to_travel_km')->nullable();

            // --- When ---
            $t->json('preferred_days')->nullable();           // [1,3,5] ISO weekdays
            $t->json('preferred_time_windows')->nullable();   // [{"start":"17:00","end":"19:30"}]
            $t->unsignedTinyInteger('sessions_per_week')->nullable();
            $t->unsignedSmallInteger('session_minutes')->nullable();
            $t->date('start_date')->nullable();
            $t->string('urgency', 20)->nullable();            // immediate | within_week | within_month | flexible

            // --- Money ---
            $t->decimal('budget_min_hourly', 8, 2)->nullable();
            $t->decimal('budget_max_hourly', 8, 2)->nullable();
            $t->decimal('budget_monthly', 10, 2)->nullable();

            // --- Who they want ---
            $t->string('preferred_teacher_gender', 12)->default('any');
            $t->json('preferred_teacher_languages')->nullable();
            $t->unsignedTinyInteger('min_teacher_experience')->nullable();
            $t->boolean('group_ok')->default(false);

            // --- Lifecycle. matched_profile_id is written back by the matching app. ---
            $t->string('status', 20)->default('open');        // open | matched | on_hold | closed
            $t->foreignId('matched_profile_id')->nullable()
                ->constrained('physical_teaching_profiles')->nullOnDelete();
            $t->timestamp('matched_at')->nullable();
            $t->text('notes')->nullable();
            $t->timestamps();

            $t->index('pincode');
            $t->index('status');
            $t->index(['state', 'district']);
            $t->index('updated_at');
        });
    }

    public function down(): void { Schema::dropIfExists('tuition_requirements'); }
};
