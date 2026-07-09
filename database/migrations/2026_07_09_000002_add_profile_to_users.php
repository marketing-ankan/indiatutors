<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('users', function (Blueprint $t) {
            $t->string('role', 20)->default('parent')->after('email');
            $t->string('phone', 20)->nullable()->after('role');
            $t->string('phone_country_code', 6)->default('+91')->after('phone');
        });
    }
    public function down(): void {
        Schema::table('users', function (Blueprint $t) {
            $t->dropColumn(['role', 'phone', 'phone_country_code']);
        });
    }
};
