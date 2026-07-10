<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        // Teacher proposes a new course/subject to teach; admin approves.
        Schema::create('course_proposals', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete(); // the teacher account
            $t->string('title', 160);
            $t->text('description')->nullable();
            $t->string('status', 20)->default('pending'); // pending / approved / rejected
            $t->timestamps();
        });

        // Per-enrollment curriculum: ordered topics the teacher defines/divides/edits.
        Schema::create('curriculum_items', function (Blueprint $t) {
            $t->id();
            $t->foreignId('enrollment_id')->constrained()->cascadeOnDelete();
            $t->unsignedInteger('position')->default(0);
            $t->string('topic', 200);
            $t->text('details')->nullable();
            $t->string('status', 20)->default('pending'); // pending / in_progress / done
            $t->timestamps();

            $t->index(['enrollment_id', 'position']);
        });

        // Notes / PPTs / lesson plans / question banks the teacher shares per enrollment.
        Schema::create('class_materials', function (Blueprint $t) {
            $t->id();
            $t->foreignId('enrollment_id')->constrained()->cascadeOnDelete();
            $t->foreignId('tutor_id')->nullable()->constrained()->nullOnDelete(); // uploader
            $t->string('type', 30)->default('note'); // note / ppt / lesson_plan / question_bank / homework / other
            $t->string('title', 160);
            $t->string('original_name')->nullable();
            $t->string('path')->nullable();          // private storage; never exposed
            $t->string('link_url', 500)->nullable(); // alternative: external link (video etc.)
            $t->timestamps();

            $t->index('enrollment_id');
        });
    }

    public function down(): void {
        Schema::dropIfExists('class_materials');
        Schema::dropIfExists('curriculum_items');
        Schema::dropIfExists('course_proposals');
    }
};
