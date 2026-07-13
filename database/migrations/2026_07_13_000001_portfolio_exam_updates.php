<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        // Student portfolio (Phase 6): achievements/certificates/milestones,
        // added by the parent or the assigned teacher.
        Schema::create('portfolio_items', function (Blueprint $t) {
            $t->id();
            $t->foreignId('student_id')->constrained()->cascadeOnDelete();
            $t->foreignId('added_by')->nullable()->constrained('users')->nullOnDelete();
            $t->string('type', 30)->default('achievement'); // achievement / certificate / milestone / artwork / other
            $t->string('title', 160);
            $t->text('description')->nullable();
            $t->date('awarded_on')->nullable();
            $t->string('link_url', 500)->nullable();
            $t->string('original_name')->nullable();
            $t->string('path')->nullable(); // private storage, never exposed
            $t->timestamps();

            $t->index('student_id');
        });

        // Exam updates (Phase 6): admin-published announcements shown on dashboards.
        Schema::create('exam_updates', function (Blueprint $t) {
            $t->id();
            $t->string('title', 200);
            $t->text('body')->nullable();
            $t->date('exam_date')->nullable();
            $t->string('link_url', 500)->nullable();
            $t->boolean('is_published')->default(true);
            $t->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamps();

            $t->index(['is_published', 'exam_date']);
        });
    }

    public function down(): void {
        Schema::dropIfExists('exam_updates');
        Schema::dropIfExists('portfolio_items');
    }
};
