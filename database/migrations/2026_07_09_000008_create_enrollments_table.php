<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        // Track which tutor a demo request was assigned to + scheduled time.
        Schema::table('demo_requests', function (Blueprint $t) {
            $t->foreignId('assigned_tutor_id')->nullable()->after('student_id')->constrained('tutors')->nullOnDelete();
            $t->timestamp('scheduled_at')->nullable()->after('status');
        });

        Schema::create('enrollments', function (Blueprint $t) {
            $t->id();
            $t->foreignId('student_id')->constrained()->cascadeOnDelete();
            $t->foreignId('tutor_id')->nullable()->constrained()->nullOnDelete();
            $t->foreignId('course_id')->nullable()->constrained()->nullOnDelete();
            $t->foreignId('demo_request_id')->nullable()->constrained()->nullOnDelete();
            $t->string('plan', 60)->nullable();
            $t->string('status', 20)->default('active'); // active / paused / completed / cancelled
            $t->text('notes')->nullable();
            $t->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('enrollments');
        Schema::table('demo_requests', function (Blueprint $t) {
            $t->dropConstrainedForeignId('assigned_tutor_id');
            $t->dropColumn('scheduled_at');
        });
    }
};
