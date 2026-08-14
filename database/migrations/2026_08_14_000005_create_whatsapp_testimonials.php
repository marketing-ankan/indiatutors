<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        // Guarded: this host kills long deploy jobs, and a retried `migrate`
        // must not trip over the half of the work that already happened.
        if (Schema::hasTable('whatsapp_testimonials')) return;

        // The WhatsApp-style testimonial cards on the homepage and shop page.
        // No seeder writes this table on purpose: the demo copy lives in the
        // front-end as a fallback, and every row here is a real message an
        // admin chose to publish — so there is nothing for a deploy to prune
        // and no ownership marker to maintain.
        Schema::create('whatsapp_testimonials', function (Blueprint $t) {
            $t->id();
            $t->string('name', 80);
            $t->string('text', 500);
            $t->string('time_label', 20)->nullable(); // "6:20 PM" — display text, not a timestamp
            $t->boolean('is_published')->default(true);
            $t->unsignedSmallInteger('position')->default(0);
            $t->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamps();

            $t->index(['is_published', 'position']);
        });
    }

    public function down(): void {
        Schema::dropIfExists('whatsapp_testimonials');
    }
};
