<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Transcripts are what the course AI answers from. Without one, a lesson's
// "Ask about this lesson" panel stays hidden — the assistant is grounded on the
// transcript only and never answers from general knowledge, so an ungrounded
// lesson has nothing to say. ai_summary caches the generated recap so it costs
// one API call per lesson for its lifetime, not one per viewer.
//
// Idempotent (hasColumn guards) to match the rest of this project's migrations:
// the cron deploy runs under set -e, so a re-run must never abort the deploy.
return new class extends Migration {
    public function up(): void {
        Schema::table('video_lessons', function (Blueprint $t) {
            if (!Schema::hasColumn('video_lessons', 'transcript')) {
                $t->longText('transcript')->nullable();
            }
            if (!Schema::hasColumn('video_lessons', 'ai_summary')) {
                $t->text('ai_summary')->nullable();
            }
        });
    }

    public function down(): void {
        Schema::table('video_lessons', function (Blueprint $t) {
            if (Schema::hasColumn('video_lessons', 'ai_summary')) $t->dropColumn('ai_summary');
            if (Schema::hasColumn('video_lessons', 'transcript'))  $t->dropColumn('transcript');
        });
    }
};
