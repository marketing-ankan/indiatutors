<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// Self-paced video courses (point #4: video classes as playlists, Udemy-style).
// A course has an ordered playlist of lessons; lessons are watched via a gated,
// signed playback URL from the video host (Bunny.net Stream) unless flagged as a
// free preview. Entitlements (who bought what) gate the paid lessons. Sample
// data is seeded in-migration so the cron deploy populates staging.
return new class extends Migration {
    public function up(): void {
        // Idempotent throughout: a half-applied earlier run (some tables/columns
        // created, then aborted) must not fail re-runs — otherwise every cron
        // deploy aborts here under set -e and never reaches the asset copy step.
        if (!Schema::hasTable('video_courses')) {
            Schema::create('video_courses', function (Blueprint $t) {
                $t->id();
                $t->string('title', 190);
                $t->string('slug', 200)->unique();
                $t->string('subtitle', 255)->nullable();
                $t->text('description')->nullable();
                $t->unsignedInteger('price')->default(0);       // INR, one-time
                $t->string('level', 40)->nullable();
                $t->string('category', 80)->nullable();
                $t->string('thumbnail_url', 500)->nullable();
                $t->unsignedInteger('position')->default(0);
                $t->boolean('is_published')->default(true);
                $t->timestamps();
            });
        }

        if (!Schema::hasTable('video_lessons')) {
            Schema::create('video_lessons', function (Blueprint $t) {
                $t->id();
                $t->foreignId('video_course_id')->constrained()->cascadeOnDelete();
                $t->string('title', 190);
                $t->string('provider', 20)->default('bunny');   // bunny | youtube
                $t->string('video_id', 120);                    // Bunny GUID or YouTube id
                $t->unsignedInteger('duration_seconds')->default(0);
                $t->boolean('is_preview')->default(false);      // free, ungated
                $t->unsignedInteger('position')->default(0);
                $t->timestamps();
            });
        }

        if (!Schema::hasTable('video_entitlements')) {
            Schema::create('video_entitlements', function (Blueprint $t) {
                $t->id();
                $t->foreignId('user_id')->constrained()->cascadeOnDelete();
                $t->foreignId('video_course_id')->constrained()->cascadeOnDelete();
                $t->foreignId('order_id')->nullable()->constrained()->nullOnDelete();
                $t->timestamp('granted_at')->nullable();
                $t->timestamps();
                $t->unique(['user_id', 'video_course_id']);
            });
        }

        // Orders can belong to an account (needed so video entitlements attach to
        // a user), and an order line can reference a video course.
        if (!Schema::hasColumn('orders', 'user_id')) {
            Schema::table('orders', fn (Blueprint $t) => $t->foreignId('user_id')->nullable()->after('id')->constrained()->nullOnDelete());
        }
        if (!Schema::hasColumn('order_items', 'video_course_id')) {
            Schema::table('order_items', fn (Blueprint $t) => $t->foreignId('video_course_id')->nullable()->after('course_id')->constrained()->nullOnDelete());
        }

        // Seed sample courses + lessons from the committed data file (only if empty,
        // so a re-run doesn't duplicate rows).
        $path = base_path('database/seeders/data/video-courses.json');
        if (is_file($path) && DB::table('video_courses')->count() === 0) {
            $data = json_decode(file_get_contents($path), true);
            $now = now();
            foreach (($data['courses'] ?? []) as $c) {
                $id = DB::table('video_courses')->insertGetId([
                    'title' => $c['title'], 'slug' => $c['slug'], 'subtitle' => $c['subtitle'] ?? null,
                    'description' => $c['description'] ?? null, 'price' => $c['price'] ?? 0,
                    'level' => $c['level'] ?? null, 'category' => $c['category'] ?? null,
                    'position' => $c['position'] ?? 0, 'is_published' => true,
                    'created_at' => $now, 'updated_at' => $now,
                ]);
                $rows = [];
                foreach (($c['lessons'] ?? []) as $i => $l) {
                    $rows[] = [
                        'video_course_id' => $id, 'title' => $l['title'], 'provider' => $l['provider'] ?? 'youtube',
                        'video_id' => $l['video_id'], 'duration_seconds' => $l['duration_seconds'] ?? 0,
                        'is_preview' => $l['is_preview'] ?? false, 'position' => $i,
                        'created_at' => $now, 'updated_at' => $now,
                    ];
                }
                if ($rows) DB::table('video_lessons')->insert($rows);
            }
        }
    }

    public function down(): void {
        Schema::table('order_items', fn (Blueprint $t) => $t->dropConstrainedForeignId('video_course_id'));
        Schema::table('orders', fn (Blueprint $t) => $t->dropConstrainedForeignId('user_id'));
        Schema::dropIfExists('video_entitlements');
        Schema::dropIfExists('video_lessons');
        Schema::dropIfExists('video_courses');
    }
};
