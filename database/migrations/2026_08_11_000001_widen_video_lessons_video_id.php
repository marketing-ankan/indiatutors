<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * video_id was string(120). That is fine for a YouTube id (11) or a Bunny GUID,
 * but an R2 object key is "{course-slug}/{filename ≤60}-{random6}.{ext}" — so a
 * course slug over ~48 characters produced a key that failed validation AFTER
 * the file had already been uploaded to R2, leaving a paid-for orphan object and
 * a 422 the admin could not act on. 255 gives the longest slug room.
 *
 * Guarded like every other migration in this project: the deploy re-runs
 * migrations on a database that may already be at this state.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('video_lessons') || !Schema::hasColumn('video_lessons', 'video_id')) {
            return;
        }
        Schema::table('video_lessons', function (Blueprint $table) {
            $table->string('video_id', 255)->change();
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('video_lessons') || !Schema::hasColumn('video_lessons', 'video_id')) {
            return;
        }
        Schema::table('video_lessons', function (Blueprint $table) {
            $table->string('video_id', 120)->change();
        });
    }
};
