<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('demo_requests', function (Blueprint $t) {
            $t->foreignId('user_id')->nullable()->after('id')->constrained()->nullOnDelete();
            $t->foreignId('student_id')->nullable()->after('user_id')->constrained()->nullOnDelete();
        });
    }
    public function down(): void {
        Schema::table('demo_requests', function (Blueprint $t) {
            $t->dropConstrainedForeignId('user_id');
            $t->dropConstrainedForeignId('student_id');
        });
    }
};
