<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Real reviews. Until now a course page showed a deterministic pseudo-rating
// and its "write a review" form only pretended to submit — there was nowhere to
// store one and nothing for staff to moderate. Reviews land as `pending` and
// appear publicly only once an admin approves them.
//
// One table covers both catalogue courses and video courses: they are separate
// entities with separate price columns, but a review is the same shape for both
// and a single moderation queue is the point.
return new class extends Migration {
    public function up(): void {
        if (Schema::hasTable('reviews')) return;   // idempotent (deploy-safe)
        Schema::create('reviews', function (Blueprint $t) {
            $t->id();
            $t->foreignId('course_id')->nullable()->constrained()->nullOnDelete();
            $t->foreignId('video_course_id')->nullable()->constrained()->nullOnDelete();
            $t->foreignId('user_id')->nullable()->constrained()->nullOnDelete();  // null = guest
            $t->string('author_name', 120);
            $t->string('author_email', 180)->nullable();
            // Range is enforced in the validator, not the column: sqlite (tests)
            // and MySQL disagree on CHECK constraints.
            $t->unsignedTinyInteger('rating')->default(5);   // 1–5
            $t->text('body')->nullable();
            $t->string('status', 20)->default('pending');    // pending | approved | rejected
            $t->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete(); // staff who typed it in
            $t->timestamps();
            $t->index(['course_id', 'status']);
            $t->index(['status', 'created_at']);
        });
    }
    public function down(): void { Schema::dropIfExists('reviews'); }
};
