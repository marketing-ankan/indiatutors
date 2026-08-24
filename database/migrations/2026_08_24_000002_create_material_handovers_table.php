<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
| The second hop of the distribution chain, and its ledger.
|
| Owner, 2026-08-24: "admin will provide teacher and teacher can also send it to
| student and this whole transfer of material should be tracked down also through
| the admin panel."
|
| Hop one is teacher_course_grants: staff hand a teacher a COURSE, and the
| teacher then reads every published file on it. Hop two is this table: a teacher
| hands ONE FILE to ONE learner. The two are deliberately different shapes
| because they are different acts — a grant is a standing fact about what a
| teacher may prepare from, a handover is a dated event with a delivery state.
|
| WHY A ROW AT ALL, when course_materials already derives access. Derived access
| answers "is this learner on the course". It cannot answer "did their teacher
| actually give them the Term 1 deck, and did they open it" — and that second
| question is the whole of what the owner asked to track. It is also additive:
| this table only ever WIDENS what one named learner may read. The derived rule
| in CourseMaterial::courseIdsFor is untouched, so ending an enrolment still
| withdraws course access exactly as before.
|
| TWO NULLABLE FKs, NOT A POLYMORPHIC PAIR. Exactly one of course_material_id /
| class_material_id is set. A morph column would store an integer the database
| cannot check, so deleting a file would leave a ledger row pointing at nothing
| and the admin trail would render a blank name. Real foreign keys with
| cascadeOnDelete mean a deleted file takes its handovers with it.
|
| to_user_id is the login that will actually READ the file — a learner's own
| account where they have one, otherwise their guardian's. student_id says WHICH
| learner it concerns, and that is what a parent's view is built on: a parent
| sees handovers for their children whether or not the row is addressed to them.
| Keeping those two apart is the fix for the oldest trap in this schema —
| students.user_id is the guardian, students.account_user_id is the student.
|
| unique(course_material_id, to_user_id) because the ledger's job is to answer
| "does this learner have this file" with one row. Re-sending is the same
| statement, not a second event, so the send endpoint updates in place. One
| consequence worth knowing: two siblings who share a guardian login and have no
| logins of their own collide here, and the second send is reported as skipped
| rather than overwriting the first. See MaterialHandoverController::send.
*/
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('material_handovers')) {
            // The table existing is not the same fact as the table being
            // finished: MySQL emits the unique index as its own ALTER after the
            // CREATE, so a run cut between the two leaves a table whose only
            // integrity rule is missing — and a bare hasTable guard would then
            // skip past it for ever, letting the same file be handed to the same
            // login twice. Cheap to check, silent to get wrong.
            if (! Schema::hasIndex('material_handovers', ['course_material_id', 'to_user_id'], 'unique')) {
                Schema::table('material_handovers', fn (Blueprint $t) => $t->unique(['course_material_id', 'to_user_id']));
            }

            return;
        }

        Schema::create('material_handovers', function (Blueprint $t) {
            $t->id();

            // Exactly one of these two is set — the company's file, or the
            // teacher's own upload against a single enrolment.
            $t->foreignId('course_material_id')->nullable()->constrained()->cascadeOnDelete();
            $t->foreignId('class_material_id')->nullable()->constrained()->cascadeOnDelete();

            // The teacher who sent it. Nullable so closing a staff or teacher
            // account never deletes the record that a family was given a file.
            $t->foreignId('from_user_id')->nullable()->constrained('users')->nullOnDelete();
            // The login that reads it. Not nullable: a handover addressed to
            // nobody is not a handover.
            $t->foreignId('to_user_id')->constrained('users')->cascadeOnDelete();
            // Which learner it concerns. Drives the parent's view.
            $t->foreignId('student_id')->nullable()->constrained()->nullOnDelete();
            $t->foreignId('enrollment_id')->nullable()->constrained()->nullOnDelete();

            $t->string('note', 300)->nullable();

            // Delivery state. Null is a real answer — "sent, not opened yet" —
            // and the admin trail reports exactly that rather than guessing.
            $t->timestamp('first_viewed_at')->nullable();
            $t->timestamp('downloaded_at')->nullable();          // most recent download
            $t->unsignedInteger('download_count')->default(0);

            $t->timestamps();                                     // created_at IS sent_at

            $t->unique(['course_material_id', 'to_user_id']);
            $t->index('to_user_id');
            $t->index('student_id');
            $t->index(['from_user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('material_handovers');
    }
};
