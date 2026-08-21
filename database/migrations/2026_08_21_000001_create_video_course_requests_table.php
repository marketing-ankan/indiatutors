<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * "Which recorded course should we make next?" — asked of the people who went
 * looking for one.
 *
 * The video catalogue is not ready to sell, so every video course page now says
 * so. A visitor who came that far has already told us something valuable by
 * arriving, and the old behaviour threw it away: they hit a page they could not
 * buy from and left, and nothing recorded that anyone had wanted it.
 *
 * This is demand capture, deliberately separate from support tickets and demo
 * requests. It is not an enquiry anybody has to answer — nobody is waiting on a
 * reply, so it must never appear in the "needs attention" queues — it is
 * evidence for a production decision: which subject to record first.
 *
 * `subject` is free text on purpose. A dropdown of the courses we already list
 * would only tell us what we already thought of, and the point is to hear the
 * thing we have not listed.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::create('video_course_requests', function (Blueprint $t) {
            $t->id();

            // Who asked. All optional except the subject: demanding contact
            // details on a "tell us what you want" form suppresses exactly the
            // casual signal it exists to collect. Someone who leaves an address
            // is asking to be told when it launches; someone who does not is
            // still a vote, and a vote is worth counting.
            $t->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $t->string('name', 120)->nullable();
            $t->string('email', 190)->nullable();
            $t->string('phone', 30)->nullable();

            $t->string('subject', 190);              // what they want recorded, verbatim
            // The same subject reduced to something that groups. Stored rather
            // than derived at read time, so tightening the rule later cannot
            // silently re-bucket rows that were already counted and acted on.
            $t->string('subject_key', 190)->nullable();
            $t->string('level', 60)->nullable();     // "Class 9", "Beginner", ...
            $t->text('message')->nullable();

            // Which page they asked from, when they asked from one. Null means
            // they used the catalogue page rather than a specific course.
            $t->foreignId('video_course_id')->nullable()
                ->constrained('video_courses')->nullOnDelete();

            // Whether they want telling when it exists. Separate from having
            // left an email: consent to be contacted is not the same fact as
            // being reachable, and conflating them is how people end up on a
            // list they never joined.
            $t->boolean('notify_me')->default(false);

            // new -> reviewed -> planned / declined. Worked by whoever decides
            // the recording schedule, not by the support desk.
            $t->string('status', 20)->default('new');

            $t->string('source', 30)->default('video_coming_soon');
            $t->timestamps();

            $t->index('subject_key');
            $t->index(['status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('video_course_requests');
    }
};
