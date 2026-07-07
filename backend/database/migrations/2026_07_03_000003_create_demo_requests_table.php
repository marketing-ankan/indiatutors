<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('demo_requests', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email');
            $table->string('phone_country_code', 6)->default('+91');
            $table->string('phone', 20);
            $table->string('subject')->nullable();
            $table->string('grade')->nullable();
            $table->string('board')->nullable();      // CBSE / ICSE / IB / IGCSE / State
            $table->string('mode')->nullable();       // online / home
            $table->string('city')->nullable();
            $table->string('country')->default('India');
            $table->string('timezone')->nullable();
            $table->text('message')->nullable();
            $table->boolean('whatsapp_consent')->default(false);
            $table->boolean('marketing_consent')->default(false);
            $table->foreignId('course_id')->nullable()->constrained()->nullOnDelete();
            $table->string('status')->default('new'); // new / contacted / allocated / converted / lost
            $table->timestamps();

            $table->index('status');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('demo_requests');
    }
};
