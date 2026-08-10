<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
| Stage 5 / F7 + F8 — the question bank and what a score is allowed to mean.
|
| Built now, ahead of the rest of track F, for one reason: F2-F6 (stop-and-ask,
| voice, board explanations, simulators) all need the AI provider, which is
| blocked on a Gemini key. A question bank and score thresholds are ordinary
| deterministic logic and need nothing external, so they can ship today and
| start collecting the answer history F8 reasons over.
|
| LEVELS 1-3 come straight off the page. They are a difficulty ladder within a
| lesson, not three separate quizzes: a student who clears level 1 is offered
| level 2, so "scored 80%" means something different at each rung and the
| ladder itself is the diagnostic.
|
| THRESHOLDS 60 / 80 / 90, also from the page. Deliberately stored in config
| (see App\Support\QuestionBank) rather than hardcoded per call site, because a
| threshold duplicated in the scoring code and again in the UI copy is a
| number that will eventually disagree with itself.
|
| WHY ATTEMPTS ARE ROWS AND NOT A RUNNING SCORE. F8 asks "which areas is this
| student weak in", and that can only be answered from individual answers —
| a stored average would tell you a student scored 70% and nothing about WHAT
| they got wrong. Each answer is kept, so weakness is computed per topic and a
| retake improves the picture instead of overwriting it.
*/
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('questions')) {
            Schema::create('questions', function (Blueprint $t) {
                $t->id();
                // A question belongs to a lesson where one exists, and otherwise
                // to a course — a syllabus-level question bank is still useful
                // before anyone has cut the material into lessons.
                $t->foreignId('video_lesson_id')->nullable()->constrained()->cascadeOnDelete();
                $t->foreignId('video_course_id')->nullable()->constrained()->cascadeOnDelete();

                $t->unsignedTinyInteger('level')->default(1);      // 1 | 2 | 3
                // The diagnostic axis. Two questions on "fractions" are what let
                // F8 say a student is weak at fractions rather than weak at
                // "question 4".
                $t->string('topic', 120)->nullable();

                $t->text('prompt');
                // [{key:'a', text:'...'}, ...] — MCQ keeps scoring objective,
                // which matters when the score drives a weakness verdict.
                $t->json('options');
                $t->string('correct_key', 8);
                $t->string('explanation', 600)->nullable();

                $t->boolean('is_published')->default(true);
                $t->unsignedInteger('position')->default(0);
                $t->timestamps();

                $t->index(['video_lesson_id', 'level', 'is_published']);
                $t->index(['video_course_id', 'level', 'is_published']);
            });
        }

        if (! Schema::hasTable('question_attempts')) {
            Schema::create('question_attempts', function (Blueprint $t) {
                $t->id();
                $t->foreignId('user_id')->constrained()->cascadeOnDelete();
                $t->foreignId('student_id')->nullable()->constrained()->nullOnDelete();
                $t->foreignId('question_id')->constrained()->cascadeOnDelete();

                // Denormalised so weakness can be computed without joining back
                // through questions for every answer — and so the verdict
                // survives a question later being edited or retired.
                $t->unsignedTinyInteger('level')->default(1);
                $t->string('topic', 120)->nullable();

                $t->string('chosen_key', 8)->nullable();
                $t->boolean('is_correct')->default(false);
                // Groups the answers of one sitting, so "this attempt" and "all
                // time" are both answerable.
                $t->uuid('attempt_group')->nullable();
                $t->timestamps();

                $t->index(['user_id', 'topic']);
                $t->index(['user_id', 'level']);
                $t->index('attempt_group');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('question_attempts');
        Schema::dropIfExists('questions');
    }
};
