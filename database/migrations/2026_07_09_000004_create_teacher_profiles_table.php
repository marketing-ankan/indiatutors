<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('teacher_profiles', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $t->string('headline')->nullable();
            $t->string('subjects')->nullable();
            $t->unsignedInteger('experience_years')->nullable();
            $t->string('city', 80)->nullable();
            $t->text('bio')->nullable();
            $t->string('status', 20)->default('pending'); // pending / approved / rejected
            $t->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('teacher_profiles'); }
};
