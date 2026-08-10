<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
| Stage 5 / E7 — a student records something they achieved, and credits it.
|
| Owner, 2026-08-10: "a place for the students to add a review to the teachers,
| or a review for IndiaTutors about the achievements he/she nailed because of
| IndiaTutors/teachers... this will work as a review or testimonial thing."
|
| So this is the real source for D4. The site currently shows demo testimonials
| plus some carried over from the WinQuest site; these replace them with
| something a named family actually wrote.
|
| CONSENT IS A COLUMN, NOT A POLICY. The August audit found achievement photos of
| identifiable minors reused from a sister brand, and most subjects here are
| children. `consent_public` defaults to FALSE: a submission is private to the
| family and to staff until someone ticks the box, and `consent_name` decides
| whether it is attributed or shown as "a Class 8 student". A testimonial we
| cannot prove was offered for publication is not usable, and rebuilding that
| proof later is impossible.
|
| WHY NOT REUSE `reviews`. A review rates a teacher out of five and is gated on a
| completed demo (D1). An achievement has no rating, may credit the platform
| rather than a person, and arrives months into an enrolment. Forcing them into
| one table would mean a rating column that is null half the time and a demo gate
| that cannot apply. They share a moderation vocabulary instead.
|
| tutor_id is nullable on purpose: "I got into IIT because of IndiaTutors" is a
| valid achievement with no single teacher to credit.
*/
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('student_achievements')) {
            return;
        }

        Schema::create('student_achievements', function (Blueprint $t) {
            $t->id();
            $t->foreignId('student_id')->constrained()->cascadeOnDelete();
            // Who submitted it — the parent who owns the account, or the
            // student themselves. Kept because consent was given by a person.
            $t->foreignId('submitted_by')->nullable()->constrained('users')->nullOnDelete();
            $t->foreignId('tutor_id')->nullable()->constrained('tutors')->nullOnDelete();

            $t->string('title', 200);
            $t->text('body')->nullable();
            $t->date('achieved_on')->nullable();

            // Publication consent, captured at submission. Default false.
            $t->boolean('consent_public')->default(false);
            $t->boolean('consent_name')->default(false);   // may we print the student's name

            $t->string('status', 20)->default('pending');  // pending | approved | rejected
            $t->string('staff_note', 300)->nullable();
            $t->timestamps();

            $t->index(['status', 'created_at']);
            $t->index(['tutor_id', 'status']);
            $t->index('student_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_achievements');
    }
};
