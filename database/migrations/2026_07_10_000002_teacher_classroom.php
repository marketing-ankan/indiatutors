<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        // Bridge a teacher User account to a directory Tutor record, so an
        // approved teacher can be assigned demos + see their own enrollments.
        Schema::table('tutors', function (Blueprint $t) {
            $t->foreignId('user_id')->nullable()->unique()->after('id')->constrained()->nullOnDelete();
        });

        // Per-enrollment class / progress log the teacher records after a session.
        Schema::create('class_logs', function (Blueprint $t) {
            $t->id();
            $t->foreignId('enrollment_id')->constrained()->cascadeOnDelete();
            $t->foreignId('tutor_id')->nullable()->constrained()->nullOnDelete(); // who logged it
            $t->string('topic');
            $t->date('held_on');
            $t->unsignedSmallInteger('duration_min')->nullable();
            $t->text('homework')->nullable();
            $t->text('notes')->nullable();
            $t->string('status', 20)->default('completed'); // completed / scheduled / missed
            $t->timestamps();

            $t->index('enrollment_id');
        });
    }

    public function down(): void {
        Schema::dropIfExists('class_logs');
        Schema::table('tutors', function (Blueprint $t) {
            $t->dropConstrainedForeignId('user_id');
        });
    }
};
