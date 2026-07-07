<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('contact_messages', function (Blueprint $t) {
            $t->id();
            $t->string('name', 120);
            $t->string('email', 180);
            $t->string('phone', 20)->nullable();
            $t->string('subject', 200)->nullable();
            $t->text('message');
            $t->string('status', 20)->default('new');
            $t->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('contact_messages'); }
};
