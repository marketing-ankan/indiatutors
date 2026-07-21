<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Public "Become a Teacher" applications (the WinQuest-style apply form). Includes
// the physical-classes address + service-radius the teacher will travel; the
// radius MATCHING logic is separate and comes later.
return new class extends Migration {
    public function up(): void {
        if (Schema::hasTable('teacher_applications')) return;   // idempotent (deploy-safe)
        Schema::create('teacher_applications', function (Blueprint $t) {
            $t->id();
            $t->string('name', 190);
            $t->string('email', 190);
            $t->string('phone', 40);
            $t->json('subjects')->nullable();            // ["Mathematics","Physics", …]
            $t->string('cv_path', 500)->nullable();      // stored privately (storage/app)
            $t->string('cv_name', 255)->nullable();      // original filename
            $t->string('video_url', 500)->nullable();    // 3-min intro (link)
            $t->text('address')->nullable();             // for home / physical tuition
            $t->string('city', 120)->nullable();
            $t->string('pincode', 12)->nullable();
            $t->unsignedSmallInteger('service_radius_km')->nullable(); // 0/null = online only
            $t->boolean('teaches_online')->default(true);
            $t->json('availability')->nullable();        // {"Mon":[9,10],"Tue":[…]}
            $t->text('notes')->nullable();
            $t->string('status', 20)->default('pending'); // pending | reviewing | approved | rejected
            $t->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('teacher_applications');
    }
};
