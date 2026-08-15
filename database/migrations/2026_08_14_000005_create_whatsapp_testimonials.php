<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        // Guarded: this host kills long deploy jobs, and a retried `migrate`
        // must not trip over the half of the work that already happened.
        if (Schema::hasTable('whatsapp_testimonials')) return;

        // The WhatsApp Testimonials section: real SCREENSHOTS of WhatsApp
        // chats, uploaded from the Content tab. The image lives in
        // storage/app/private/uploads/whatsapp — storage/ is the one directory
        // the deploy never touches, so uploads survive the cron pull; anything
        // written under public/ would be rm -rf'd within five minutes. It is
        // served back through a Laravel route, so no symlink and no docroot
        // copy is involved.
        //
        // No seeder writes this table on purpose: the demo cards live in the
        // front-end as a fallback, and every row here is a real screenshot an
        // admin chose to publish — so there is nothing for a deploy to prune
        // and no ownership marker to maintain.
        Schema::create('whatsapp_testimonials', function (Blueprint $t) {
            $t->id();
            $t->string('image_path', 500);           // storage-relative, hashed filename
            $t->string('label', 120)->nullable();    // alt text / who or which class it is
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
