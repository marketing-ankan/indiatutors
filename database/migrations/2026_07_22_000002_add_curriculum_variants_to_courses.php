<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Per-board curriculum variants (WinQuest-parity board chips on the Curriculum
// tab). `curriculum` stays the CBSE/NCERT default; variants holds e.g.
// {"India · ICSE (CISCE)": [units…]}. Idempotent (deploy-safe).
return new class extends Migration {
    public function up(): void {
        if (Schema::hasColumn('courses', 'curriculum_variants')) return;
        Schema::table('courses', fn (Blueprint $t) => $t->json('curriculum_variants')->nullable()->after('curriculum'));
    }
    public function down(): void {
        Schema::table('courses', fn (Blueprint $t) => $t->dropColumn('curriculum_variants'));
    }
};
