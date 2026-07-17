<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// Real events & workshops (WinQuest-approved feature): dated, individually
// addressable event pages with registration. Initial events are inserted here
// (not a seeder) so the cron deploy's `migrate --force` populates staging on
// the same run that ships the code; ongoing management is the Staff Console
// Events tab.
return new class extends Migration {
    public function up(): void {
        Schema::create('events', function (Blueprint $t) {
            $t->id();
            $t->string('title', 180);
            $t->string('slug', 190)->unique();
            $t->string('icon', 16)->default('🎓');
            $t->string('category', 80)->nullable();
            $t->text('description')->nullable();
            $t->dateTime('starts_at')->nullable();
            $t->dateTime('ends_at')->nullable();
            $t->string('mode', 40)->default('Online');
            $t->string('batch_size', 40)->nullable();
            $t->string('session_duration', 60)->nullable();
            $t->string('schedule_note', 200)->nullable();
            $t->string('time_note', 120)->nullable();
            $t->string('status', 20)->default('upcoming'); // upcoming | completed | draft
            $t->timestamps();
        });

        $now = now();
        DB::table('events')->insert([
            [
                'title' => 'Chess Camp for Beginners', 'slug' => 'chess-camp-for-beginners', 'icon' => '♟️', 'category' => 'Mind Sports',
                'description' => "According to studies done at the University of Memphis, playing chess significantly improves children's visual memory, attention span, and spatial-reasoning ability. Need some encouragement for your kid? Register for a 2-day free live event through our Zoom online interactive sessions.",
                'starts_at' => '2026-07-29 08:00:00', 'ends_at' => '2026-08-30 17:00:00', 'mode' => 'Online',
                'batch_size' => '10–15 students', 'session_duration' => '1 hour per session',
                'schedule_note' => 'Dates are communicated and organised based on the number of registrations received.',
                'time_note' => '8:00 am – 5:00 pm (Asia/Kolkata)', 'status' => 'upcoming',
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'title' => 'PSAT/SAT English Bootcamp', 'slug' => 'psat-sat-english-bootcamp', 'icon' => '📘', 'category' => 'Competitive Exams',
                'description' => 'Focused reading and writing practice for the PSAT/SAT English section — timed sections, strategy walkthroughs and detailed review in live, interactive Zoom sessions.',
                'starts_at' => '2026-07-29 08:00:00', 'ends_at' => '2026-08-30 17:00:00', 'mode' => 'Online',
                'batch_size' => '10–15 students', 'session_duration' => '1 hour per session',
                'schedule_note' => 'Dates are communicated and organised based on the number of registrations received.',
                'time_note' => '8:00 am – 5:00 pm (Asia/Kolkata)', 'status' => 'upcoming',
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'title' => 'Digital PSAT-10 / NMSQT SAT Math Workshop', 'slug' => 'digital-psat-nmsqt-sat-math-workshop', 'icon' => '📐', 'category' => 'Competitive Exams',
                'description' => 'Live walkthroughs of the trickiest Digital SAT / PSAT-10 / NMSQT math problems — adaptive-test strategy, calculator policy and timed practice with an expert mentor.',
                'starts_at' => '2026-07-29 08:00:00', 'ends_at' => '2026-08-30 17:00:00', 'mode' => 'Online',
                'batch_size' => '10–15 students', 'session_duration' => '1 hour per session',
                'schedule_note' => 'Dates are communicated and organised based on the number of registrations received.',
                'time_note' => '8:00 am – 5:00 pm (Asia/Kolkata)', 'status' => 'upcoming',
                'created_at' => $now, 'updated_at' => $now,
            ],
        ]);
    }
    public function down(): void { Schema::dropIfExists('events'); }
};
