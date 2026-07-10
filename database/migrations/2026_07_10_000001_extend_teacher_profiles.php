<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('teacher_profiles', function (Blueprint $t) {
            $t->string('qualification')->nullable()->after('headline');
            $t->string('languages')->nullable()->after('subjects');
            $t->decimal('fee_hourly', 10, 2)->nullable()->after('experience_years');
            $t->string('teaching_mode', 20)->default('online')->after('city'); // online / home / both
            $t->string('service_areas')->nullable()->after('teaching_mode');    // pincodes / localities
            $t->json('availability')->nullable()->after('service_areas');        // { days:[], slots:'' }
        });
    }
    public function down(): void {
        Schema::table('teacher_profiles', function (Blueprint $t) {
            $t->dropColumn(['qualification','languages','fee_hourly','teaching_mode','service_areas','availability']);
        });
    }
};
