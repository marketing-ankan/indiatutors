<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// The tutor-enquiry form (live parity) requires phone, not email — allow
// contact messages without an email address.
return new class extends Migration {
    public function up(): void {
        Schema::table('contact_messages', function (Blueprint $t) {
            $t->string('email', 180)->nullable()->change();
        });
    }
    public function down(): void {
        Schema::table('contact_messages', function (Blueprint $t) {
            $t->string('email', 180)->nullable(false)->change();
        });
    }
};
