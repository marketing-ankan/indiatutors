<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
| Stage 4 / C4 — the regular timetable that follows a successful demo.
|
| The chain the founder's page draws ends "class schedule", and until now it had
| nowhere to land. An enrolment recorded WHO teaches WHOM and class_logs recorded
| what already happened, but nothing said when the classes actually are. Families
| were told their timetable on a phone call and it lived in somebody's memory.
|
| WHY A TABLE AND NOT A JSON COLUMN. Two classes a week is the normal case, and
| each slot needs to be edited, cancelled and reasoned about on its own — "move
| Tuesday to 5pm" must not rewrite Thursday. A teacher's week is also a query
| ("what am I teaching on Wednesday"), which JSON makes needlessly hard.
|
| WEEKDAY IS ISO-8601 (1 = Monday … 7 = Sunday), matching tuition_requirements
| .preferred_days, which the intake form already collects on that basis, and
| Carbon's dayOfWeekIso. Picking the other convention here would have meant a
| silent off-by-one every time a requirement seeded a schedule.
|
| start_time is a TIME, not a datetime: a weekly slot is "Tuesdays at 16:00",
| a recurring rule rather than one moment. The concrete dated occurrences are
| class_logs, which already exist and are written as classes are held.
*/
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('enrollment_schedules')) {
            return;
        }

        Schema::create('enrollment_schedules', function (Blueprint $t) {
            $t->id();
            $t->foreignId('enrollment_id')->constrained()->cascadeOnDelete();
            $t->unsignedTinyInteger('weekday');            // 1 = Mon … 7 = Sun (ISO-8601)
            $t->time('start_time');
            $t->unsignedSmallInteger('duration_minutes')->default(60);
            // Kept rather than deleted when a slot stops running, so the history
            // of what a family was promised survives a timetable change.
            $t->boolean('active')->default(true);
            $t->string('note', 200)->nullable();
            $t->timestamps();

            $t->index(['enrollment_id', 'active']);
            // One enrolment cannot hold two classes at the same moment of the
            // week. Deliberately ignores `active`: reactivating a slot must not
            // be able to collide with a live one.
            $t->unique(['enrollment_id', 'weekday', 'start_time'], 'enrollment_schedule_unique_slot');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('enrollment_schedules');
    }
};
