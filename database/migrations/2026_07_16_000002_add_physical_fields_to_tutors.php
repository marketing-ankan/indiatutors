<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Physical-classes / home-tuition fields on the directory tutors: the pincodes a
// tutor serves (for location matching) and the grades they teach (for grade-wise
// matching). Values are seeded by TutorSeeder so a fresh install has them too.
return new class extends Migration {
    public function up(): void {
        Schema::table('tutors', function (Blueprint $t) {
            $t->string('pincodes', 400)->nullable()->after('localities'); // CSV of service pincodes
            $t->string('grades', 220)->nullable()->after('pincodes');     // CSV of grades taught
        });
    }
    public function down(): void {
        Schema::table('tutors', fn (Blueprint $t) => $t->dropColumn(['pincodes', 'grades']));
    }
};
