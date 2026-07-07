<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('demo_requests', function (Blueprint $t) {
            $t->id();
            $t->string('name', 120);
            $t->string('email', 180);
            $t->string('phone_country_code', 6)->default('+91');
            $t->string('phone', 20);
            $t->string('subject', 120)->nullable();
            $t->string('grade', 40)->nullable();
            $t->string('board', 20)->nullable();
            $t->string('mode', 20)->nullable();
            $t->string('city', 80)->nullable();
            $t->string('country', 80)->default('India');
            $t->string('timezone', 60)->nullable();
            $t->text('message')->nullable();
            $t->boolean('whatsapp_consent')->default(false);
            $t->boolean('marketing_consent')->default(false);
            $t->foreignId('course_id')->nullable()->constrained()->nullOnDelete();
            $t->string('status', 20)->default('new');
            $t->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('demo_requests'); }
};
