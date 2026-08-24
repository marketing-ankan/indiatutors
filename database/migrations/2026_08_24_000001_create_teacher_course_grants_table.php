<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
| Staff handing a teacher a course's material, directly.
|
| course_materials deliberately derives access instead of storing it: a teacher
| sees the material for courses they teach, where "teach" means an active
| enrolment with a course_id. That rule is right for STUDENTS and stays exactly
| as it is — enrol a child, they gain the files; end the enrolment, they lose
| them, with no second list to keep in step.
|
| For a TEACHER it inverts the order of events. The owner's ask is "admin can
| simply provide them the materials", and the moment that matters is BEFORE the
| teacher has students: a teacher approved on Monday needs the syllabus PPT to
| prepare, and has no enrolment to derive anything from. The database says the
| same thing — of the enrolments on this platform, the ones created from a
| free-text demo carry course_id = NULL, so even a teacher WITH a student can be
| entitled to nothing. docs/ECOSYSTEM-PLAN.md E3+E4 records the same gap.
|
| So this table is the explicit staff act, and only that. It widens what a
| TEACHER may read (see CourseMaterial::courseIdsFor). It must never widen what
| a student or parent may read — granting a teacher a course hands their
| students nothing, because the learner branch of that method does not consult
| this table at all.
|
| unique(tutor_id, course_id) because a grant is a fact, not an event: granting
| the same course twice is the same statement, and a second row would only
| double every count built on it.
*/
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('teacher_course_grants')) {
            // The table existing is not the same fact as the table being
            // finished: MySQL emits the unique index as its own ALTER after the
            // CREATE, so a run cut between the two leaves the table without the
            // one rule the design above rests on — and a bare hasTable guard
            // would skip past it for ever, letting the same course be granted
            // twice and doubling every count built on it.
            if (! Schema::hasIndex('teacher_course_grants', ['tutor_id', 'course_id'], 'unique')) {
                Schema::table('teacher_course_grants', fn (Blueprint $t) => $t->unique(['tutor_id', 'course_id']));
            }

            return;
        }

        Schema::create('teacher_course_grants', function (Blueprint $t) {
            $t->id();
            $t->foreignId('tutor_id')->constrained()->cascadeOnDelete();
            $t->foreignId('course_id')->constrained()->cascadeOnDelete();
            // Who handed it over. Nullable so removing a staff account never
            // silently withdraws a teacher's access to their own syllabus.
            $t->foreignId('granted_by')->nullable()->constrained('users')->nullOnDelete();
            $t->string('note', 300)->nullable();
            $t->timestamps();

            $t->unique(['tutor_id', 'course_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('teacher_course_grants');
    }
};
