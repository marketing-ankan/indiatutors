<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        // In-app notifications (Phase 8) — bell feed on the dashboard.
        Schema::create('app_notifications', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->string('type', 40);            // teacher_approved / proposal_decided / demo_scheduled / enrolled / material_shared / reschedule_requested / reschedule_decided
            $t->string('title', 160);
            $t->string('body', 500)->nullable();
            $t->timestamp('read_at')->nullable();
            $t->timestamps();

            $t->index(['user_id', 'read_at']);
        });

        // Parent-initiated reschedule requests (Phase 8), acted on by the teacher.
        Schema::create('reschedule_requests', function (Blueprint $t) {
            $t->id();
            $t->foreignId('enrollment_id')->constrained()->cascadeOnDelete();
            $t->foreignId('requested_by')->constrained('users')->cascadeOnDelete(); // the parent
            $t->date('preferred_date')->nullable();
            $t->string('reason', 500)->nullable();
            $t->string('status', 20)->default('pending'); // pending / accepted / declined
            $t->timestamps();

            $t->index(['enrollment_id', 'status']);
        });
    }

    public function down(): void {
        Schema::dropIfExists('reschedule_requests');
        Schema::dropIfExists('app_notifications');
    }
};
