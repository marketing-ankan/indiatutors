<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
| Stage 5 / E2 + E9 — one dated class the assigned teacher cannot take.
|
| Both features hang off the SAME event, which is why they share a table. The
| owner described them separately, but the trigger is identical: "the allotted
| teacher is not present on this date". What differs is only the resolution:
|
|   substitute — another teacher covers this one class (E2). Owner, 2026-08-10:
|                "substitute is for that one class only" — the original teacher
|                returns the following week, so this must NOT touch
|                enrollment_schedules, which is the standing arrangement.
|   online     — the same teacher takes it online instead of visiting (E9),
|                spending one unit of their 25%-per-month allowance.
|   cancelled  — no cover found and no online option; the class does not happen.
|
| WHY A DATED ROW AT ALL. enrollment_schedules is a weekly RULE and class_logs
| are classes already HELD. Nothing represented a specific future occurrence, so
| there was nowhere to record "the Tuesday-4pm class, but the one on 18 August".
| This table is that missing concept, created only when something deviates from
| the rule — materialising every future occurrence would be a calendar, and the
| standing timetable already is one.
|
| (enrollment_id, occurs_on) is UNIQUE: an enrolment can have at most one
| deviation per day. Two rows for the same class would mean two substitutes, or
| a class both moved online and covered by someone else.
*/
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('class_absences')) {
            return;
        }

        Schema::create('class_absences', function (Blueprint $t) {
            $t->id();
            $t->foreignId('enrollment_id')->constrained()->cascadeOnDelete();
            // Which weekly slot this is a deviation from. nullOnDelete: a
            // timetable change must not erase the record of a class already
            // covered by someone.
            $t->foreignId('enrollment_schedule_id')->nullable()->constrained('enrollment_schedules')->nullOnDelete();
            $t->date('occurs_on');
            $t->time('start_time')->nullable();   // copied from the schedule, so the record survives a retimed slot

            $t->foreignId('original_tutor_id')->nullable()->constrained('tutors')->nullOnDelete();
            $t->foreignId('substitute_tutor_id')->nullable()->constrained('tutors')->nullOnDelete();

            // requested → the teacher said they cannot attend, nothing resolved yet
            // covered    → a substitute is assigned
            // online     → the same teacher takes it online (E9 allowance spent)
            // uncovered  → nobody available; needs a human
            // cancelled  → the class will not happen
            $t->string('status', 20)->default('requested');
            $t->string('reason', 300)->nullable();

            // Did the system pick the substitute, or a person? The automation
            // mandate says coordinators should rarely intervene — this is how we
            // find out whether that is actually true.
            $t->boolean('auto_assigned')->default(false);
            $t->foreignId('decided_by')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamp('resolved_at')->nullable();

            $t->timestamps();

            $t->unique(['enrollment_id', 'occurs_on'], 'class_absence_unique_day');
            $t->index(['status', 'occurs_on']);
            $t->index('substitute_tutor_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('class_absences');
    }
};
