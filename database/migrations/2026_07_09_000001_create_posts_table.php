<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('posts', function (Blueprint $t) {
            $t->id();
            $t->string('title');
            $t->string('slug')->unique();
            $t->string('excerpt', 400)->nullable();
            $t->longText('body')->nullable();
            $t->string('image_url', 500)->nullable();
            $t->string('author', 120)->default('IndiaTutors Team');
            $t->boolean('is_published')->default(true);
            $t->timestamp('published_at')->nullable();
            $t->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('posts'); }
};
