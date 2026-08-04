<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// What a teacher can actually teach, one row per (subject × grade range × boards).
//
// The old model — a comma-separated `subjects` string on the tutor — cannot
// express the thing that decides most matches: "I take Physics for 11–12 CBSE,
// but Maths only up to Class 8." A CSV match would send that teacher a Class 12
// Maths lead and burn the lead and the relationship. Splitting it out also lets
// the fee differ by grade, which it always does in practice.
return new class extends Migration {
    public function up(): void {
        if (Schema::hasTable('teaching_offerings')) return;
        Schema::create('teaching_offerings', function (Blueprint $t) {
            $t->id();
            $t->foreignId('profile_id')->constrained('physical_teaching_profiles')->cascadeOnDelete();
            $t->string('subject', 120);
            // Stored as an ordinal (0 = pre-primary, 1..12 = class) so a range
            // check is arithmetic, not string matching in the matcher.
            $t->unsignedTinyInteger('grade_from')->nullable();
            $t->unsignedTinyInteger('grade_to')->nullable();
            $t->json('boards')->nullable();               // ["CBSE","ICSE","State - West Bengal"]
            $t->string('medium', 60)->nullable();         // language of instruction for THIS subject
            $t->string('level', 20)->nullable();          // school | board | competitive | skill
            $t->string('exam_target', 120)->nullable();   // JEE Main, NEET, NTSE, Olympiad…
            $t->decimal('fee_hourly', 8, 2)->nullable();
            $t->decimal('fee_monthly', 10, 2)->nullable();
            $t->unsignedTinyInteger('experience_years')->nullable();  // in THIS subject
            $t->boolean('is_primary')->default(false);    // their strongest subject
            $t->timestamps();

            $t->index('subject');
            $t->index(['profile_id', 'subject']);
        });
    }

    public function down(): void { Schema::dropIfExists('teaching_offerings'); }
};
