<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('students', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete(); // guardian / owner
            $t->string('name');
            $t->string('grade', 40)->nullable();
            $t->string('board', 20)->nullable();
            $t->string('subjects')->nullable();
            $t->date('date_of_birth')->nullable();
            $t->text('notes')->nullable();
            $t->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('students'); }
};
