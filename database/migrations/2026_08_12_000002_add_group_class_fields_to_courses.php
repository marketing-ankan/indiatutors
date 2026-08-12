<?php

use App\Support\GroupClassImporter;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Makes /group-classes editable by putting it on the EXISTING courses table.
 *
 * All 19 group classes are already Course rows — same slugs, same prices, and
 * their 5 categories are existing Category records. What was missing was a way
 * to know WHICH courses are group classes: the category filter returns 46 and
 * the group-rate filter 43, against the 19 actually shown, so the list cannot be
 * derived. `is_group` is that one bit.
 *
 * The group-only columns exist because the card genuinely says something
 * different from the course page — the course sells "one-to-one", the card sells
 * "group sessions" — so reusing short_description would silently rewrite the
 * /courses pitch.
 *
 * CRITICAL: none of these columns may ever be added to CourseSeeder's $attrs.
 * That seeder does updateOrCreate over name/price/description/image/position and
 * forces is_published => true, so anything it lists is reverted the next time
 * courses.json changes. Columns it does not name survive, which is the whole
 * reason group data can live here safely.
 *
 * The fabricated counters do NOT come across. "119 Batches done", "16 Ongoing",
 * the 57 student counts and the 19 strike-through prices are invented and frozen
 * — they exist nowhere but the JSON file, and the database has sale_price = 0 on
 * all 19. The columns exist and seed NULL; the card hides each chip when blank,
 * so nothing false ships and the owner can type real numbers whenever they have
 * them.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('courses')) {
            return;
        }

        Schema::table('courses', function (Blueprint $table) {
            if (!Schema::hasColumn('courses', 'is_group')) {
                $table->boolean('is_group')->default(false)->index();
            }
            if (!Schema::hasColumn('courses', 'group_about')) {
                $table->text('group_about')->nullable();
            }
            if (!Schema::hasColumn('courses', 'group_highlights')) {
                $table->json('group_highlights')->nullable();
            }
            if (!Schema::hasColumn('courses', 'group_age_range')) {
                $table->string('group_age_range', 40)->nullable();
            }
            if (!Schema::hasColumn('courses', 'group_duration_weeks')) {
                $table->unsignedSmallInteger('group_duration_weeks')->nullable();
            }
            // Marketing counters. Nullable and seeded NULL on purpose — see above.
            if (!Schema::hasColumn('courses', 'group_batches_done')) {
                $table->unsignedInteger('group_batches_done')->nullable();
            }
            if (!Schema::hasColumn('courses', 'group_ongoing_batches')) {
                $table->unsignedInteger('group_ongoing_batches')->nullable();
            }
        });

        if (!Schema::hasTable('course_batches')) {
            Schema::create('course_batches', function (Blueprint $table) {
                $table->id();
                $table->foreignId('course_id')->constrained()->cascadeOnDelete();
                $table->string('name', 60);                 // Beginner / Intermediate / …
                // Split rather than one fused "Sat-Sun · 10:00–11:00 AM IST"
                // string: fused, it cannot be sorted, filtered or translated.
                $table->string('schedule_days', 60)->nullable();
                $table->string('schedule_time', 60)->nullable();
                $table->string('timezone', 20)->default('IST');
                $table->unsignedSmallInteger('seats_total')->nullable();
                $table->unsignedInteger('position')->default(0);
                $table->timestamps();
            });
        }

        $this->seedFromLegacyJson();
    }

    /**
     * Import for an EXISTING database — the deploy case. The courses table is
     * already populated when this runs, so the cards match rows by slug.
     *
     * A fresh install is the opposite: every migration runs BEFORE the first
     * seeder, so the catalogue is empty here and nothing matches. That path is
     * covered by GroupClassSeeder, which calls the same importer after
     * CourseSeeder. Both are idempotent, so running both imports once.
     */
    private function seedFromLegacyJson(): void
    {
        GroupClassImporter::import();
    }

    public function down(): void
    {
        Schema::dropIfExists('course_batches');
        if (!Schema::hasTable('courses')) return;
        Schema::table('courses', function (Blueprint $table) {
            foreach (['is_group','group_about','group_highlights','group_age_range',
                      'group_duration_weeks','group_batches_done','group_ongoing_batches'] as $col) {
                if (Schema::hasColumn('courses', $col)) $table->dropColumn($col);
            }
        });
    }
};
