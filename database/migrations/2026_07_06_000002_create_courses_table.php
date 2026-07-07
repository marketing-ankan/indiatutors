<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('courses', function (Blueprint $t) {
            $t->id();
            $t->string('sku', 120)->nullable()->unique();
            $t->string('name');
            $t->string('slug')->unique();
            $t->text('short_description')->nullable();
            $t->longText('description')->nullable();
            $t->decimal('regular_price', 10, 2)->default(0);
            $t->decimal('sale_price', 10, 2)->nullable();
            $t->string('image_url', 500)->nullable();
            $t->boolean('is_featured')->default(false);
            $t->boolean('is_published')->default(true);
            $t->unsignedInteger('position')->default(0);
            $t->timestamps();
        });
        Schema::create('category_course', function (Blueprint $t) {
            $t->foreignId('category_id')->constrained()->cascadeOnDelete();
            $t->foreignId('course_id')->constrained()->cascadeOnDelete();
            $t->primary(['category_id','course_id']);
        });
    }
    public function down(): void {
        Schema::dropIfExists('category_course');
        Schema::dropIfExists('courses');
    }
};
