<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('courses', function (Blueprint $t) {
            $t->string('subtitle')->nullable()->after('name');
            $t->string('age', 50)->nullable()->after('short_description');
            $t->json('pills')->nullable()->after('age');
            $t->json('curriculum')->nullable()->after('pills');
        });
    }
    public function down(): void {
        Schema::table('courses', function (Blueprint $t) {
            $t->dropColumn(['subtitle', 'age', 'pills', 'curriculum']);
        });
    }
};
