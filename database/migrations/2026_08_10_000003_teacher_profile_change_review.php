<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
| Stage 4 / A3 + A4 — a teacher's edits reach the public profile, but only
| after a human looks at them.
|
| THE BUG THIS FIXES. AdminController::linkTutor copies a teacher_profiles row
| into the public `tutors` row exactly once, at approval, and returns early
| forever after (`if ($user->tutor()->exists()) return;`). TeacherController::
| updateMine writes only to teacher_profiles. So the public directory is frozen
| at the snapshot taken on approval day: a teacher who raises their fee from
| ₹800 to ₹1500, adds a qualification or changes the subjects they teach sees
| their own portal update and the public page keep advertising the old values.
| Verified on the preview database before writing this.
|
| It is the worse of the two possible failures. Nobody notices stale-but-
| plausible data, and families book — and are quoted — on it.
|
| WHY A REVIEW GATE AND NOT A STRAIGHT SYNC. Making updateMine write through to
| `tutors` would fix staleness and open a hole: whatever a teacher types
| (headline, bio, qualification, fee) would be live on a public page instantly,
| with no human in between. This is the same site that gates a phone number
| behind a coordinator. So edits mark the profile for review, and an admin
| publishes them — one timestamp, no shadow copy of every field.
|
| A timestamp rather than a boolean, to match contact_released_at: "changes are
| pending" and "changes have been pending for nine days" are different facts,
| and only one of them tells staff they have a backlog.
*/
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('teacher_profiles')) {
            return;
        }
        Schema::table('teacher_profiles', function (Blueprint $t) {
            if (! Schema::hasColumn('teacher_profiles', 'changes_submitted_at')) {
                $t->timestamp('changes_submitted_at')->nullable();
            }
            // When the public row was last brought in line with this profile.
            // Null on a profile that has a tutor means the pre-fix state: synced
            // once at approval and never since.
            if (! Schema::hasColumn('teacher_profiles', 'published_at')) {
                $t->timestamp('published_at')->nullable();
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('teacher_profiles')) {
            return;
        }
        foreach (['changes_submitted_at', 'published_at'] as $col) {
            if (Schema::hasColumn('teacher_profiles', $col)) {
                Schema::table('teacher_profiles', fn (Blueprint $t) => $t->dropColumn($col));
            }
        }
    }
};
