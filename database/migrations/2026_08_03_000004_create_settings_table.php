<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Small key/value store for settings staff can change without a deploy. First
// user: the Google Business "write a review" link the console hands to parents.
return new class extends Migration {
    public function up(): void {
        if (Schema::hasTable('settings')) return;   // idempotent (deploy-safe)
        Schema::create('settings', function (Blueprint $t) {
            $t->string('key', 80)->primary();
            $t->text('value')->nullable();
            $t->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('settings'); }
};
