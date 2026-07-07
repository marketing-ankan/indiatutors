<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('tutors', function (Blueprint $t) {
            $t->id();
            $t->string('name');
            $t->string('slug')->unique();
            $t->string('tagline', 500)->nullable();
            $t->text('qualification')->nullable();
            $t->unsignedInteger('experience_years')->nullable();
            $t->string('subjects', 500)->nullable();       // comma-separated
            $t->decimal('fee_hourly', 10, 2)->default(0);
            $t->decimal('fee_trial', 10, 2)->default(0);
            $t->string('city', 100)->nullable();
            $t->string('state', 100)->nullable();
            $t->string('localities', 500)->nullable();     // comma-separated
            $t->string('languages', 300)->nullable();      // comma-separated
            $t->string('teaching_mode', 30)->default('online'); // online / home / both
            $t->boolean('verified')->default(true);
            $t->boolean('is_published')->default(true);
            $t->longText('bio')->nullable();
            $t->string('image_url', 500)->nullable();
            $t->unsignedInteger('position')->default(0);
            $t->timestamps();

            $t->index('city');
            $t->index('verified');
            $t->index('is_published');
        });
    }
    public function down(): void { Schema::dropIfExists('tutors'); }
};
