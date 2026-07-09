<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('kyc_documents', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->string('type', 30);          // aadhaar / pan / photo / certificate / other
            $t->string('original_name');
            $t->string('path', 500);         // private storage path
            $t->string('status', 20)->default('pending'); // pending / verified / rejected
            $t->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('kyc_documents'); }
};
