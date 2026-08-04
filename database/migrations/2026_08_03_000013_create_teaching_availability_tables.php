<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Availability, in the one shape a matcher can intersect with a family's
// preferred times: real weekday + start/end rows.
//
// The free-text "5-8pm weekdays" the teacher profile has today is unusable —
// nothing can compute an overlap from it. Two tables because availability has
// two natures: a recurring weekly pattern, and the exceptions to it (exam duty,
// a wedding, a month away). Matching on the pattern alone books teachers who
// are not there.
return new class extends Migration {
    public function up(): void {
        if (!Schema::hasTable('teaching_availability_slots')) {
            Schema::create('teaching_availability_slots', function (Blueprint $t) {
                $t->id();
                $t->foreignId('profile_id')->constrained('physical_teaching_profiles')->cascadeOnDelete();
                $t->unsignedTinyInteger('weekday');    // ISO-8601: 1 = Monday … 7 = Sunday
                $t->time('start_time');
                $t->time('end_time');
                $t->timestamps();

                $t->index(['profile_id', 'weekday']);
            });
        }

        if (!Schema::hasTable('teaching_availability_exceptions')) {
            Schema::create('teaching_availability_exceptions', function (Blueprint $t) {
                $t->id();
                $t->foreignId('profile_id')->constrained('physical_teaching_profiles')->cascadeOnDelete();
                $t->date('date');
                // false = blocked out (the common case); true = extra availability
                // on a day the weekly pattern says they are off.
                $t->boolean('is_available')->default(false);
                $t->time('start_time')->nullable();    // null = the whole day
                $t->time('end_time')->nullable();
                $t->string('reason', 190)->nullable();
                $t->timestamps();

                $t->index(['profile_id', 'date']);
            });
        }
    }

    public function down(): void {
        Schema::dropIfExists('teaching_availability_exceptions');
        Schema::dropIfExists('teaching_availability_slots');
    }
};
