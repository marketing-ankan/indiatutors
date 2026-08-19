<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Which classes a teacher actually teaches.
 *
 * Every tutor in the directory currently claims Pre-primary through Class 12,
 * because that full range is what the publisher seeds on creation and there has
 * never been a field for the teacher to narrow it. So a drums teacher and a
 * yoga teacher both advertise that they teach Class 12, which is untrue on a
 * public profile, and it makes the class a worthless matching signal: when
 * every teacher matches every class, the signal cannot tell anyone apart.
 *
 * Nullable, and the publisher only pushes it when it is actually set. A blank
 * here means "not stated yet", which must keep the existing listing rather than
 * wipe a range staff may have narrowed by hand.
 */
return new class extends Migration {
    public function up(): void {
        if (Schema::hasColumn('teacher_profiles', 'grades')) return;

        Schema::table('teacher_profiles', function (Blueprint $t) {
            $t->string('grades', 300)->nullable()->after('subjects');
        });
    }

    public function down(): void {
        if (! Schema::hasColumn('teacher_profiles', 'grades')) return;

        Schema::table('teacher_profiles', function (Blueprint $t) {
            $t->dropColumn('grades');
        });
    }
};
