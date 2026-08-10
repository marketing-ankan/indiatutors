<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
| Stage 5 / E3 + E4 — the company's own teaching material.
|
| Owner, 2026-08-10: "the teacher will teach students using PPT or PDF provided
| by the company itself... for a certain class or syllabus the teacher will be
| provided with the material, and that material will also be provided to the
| enrolled student."
|
| So E3 and E4 are ONE artefact with two audiences, and this is deliberately a
| single table rather than a teacher copy and a student copy. Two tables would
| mean two upload paths for the same PPT and an inevitable day where the teacher
| is teaching from v2 while the class is reading v1.
|
| NOT class_materials, which already exists and is a different thing: that is a
| TEACHER uploading to ONE enrolment (their own notes, this week's homework).
| This is the COMPANY publishing to a COURSE, seen by every enrolment on it.
| Same file shape, opposite direction, different lifetime.
|
| ACCESS IS DERIVED, NEVER STORED. There is no join table saying which student
| may read which file: a learner sees the materials for courses they are
| enrolled in, and a teacher sees the materials for courses they teach. Enrol
| someone and they gain access; end the enrolment and they lose it, with no
| second list to keep in step.
|
| Files live on the private `local` disk and are served through a controller
| that re-checks entitlement, exactly like class materials and KYC. A public
| URL would be a link that outlives the enrolment.
*/
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('course_materials')) {
            return;
        }

        Schema::create('course_materials', function (Blueprint $t) {
            $t->id();
            $t->foreignId('course_id')->constrained()->cascadeOnDelete();
            $t->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();

            $t->string('type', 30)->default('ppt');   // ppt | pdf | note | question_bank | other
            $t->string('title', 160);
            $t->string('description', 300)->nullable();

            $t->string('path', 500)->nullable();          // private disk
            $t->string('original_name', 200)->nullable();
            $t->string('link_url', 500)->nullable();      // for material hosted elsewhere
            $t->unsignedInteger('size_bytes')->nullable();

            // Staff can stage a file before releasing it. Unpublished material
            // is invisible to teachers AND students — a half-finished deck must
            // not reach a class because someone uploaded it early.
            $t->boolean('is_published')->default(true);
            // Teaching order, so a syllabus reads as a sequence rather than by
            // upload time.
            $t->unsignedInteger('position')->default(0);

            $t->timestamps();

            $t->index(['course_id', 'is_published', 'position']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('course_materials');
    }
};
