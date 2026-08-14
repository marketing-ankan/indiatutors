<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Nests the last of the top-level categories the WordPress export left flat.
 *
 * Same defect as Python (see the previous migration): eleven courses came over
 * with sibling chains such as ["Guitar", "Musical Instruments"] instead of the
 * single chain "Musical Instruments > Guitar", so instrument and subject
 * categories sat beside the sections that should contain them. The tell is that
 * Musical Instruments already lists Violin, Cello, Drums and fourteen more —
 * but not Guitar or Piano, and Languages lists eleven tongues but not Spoken
 * English.
 *
 * Only re-parenting is done here, and only for categories that KEEP existing.
 * Music, Coding and "IT Technologies for Kids" are retired rather than moved:
 * courses.json now points their courses at categories that already existed
 * (Musical Instruments > Violin, IT Technologies > Python, > AI & ML,
 * > Robotics), which leaves those three holding nothing, and CourseSeeder drops
 * any category with no courses and no children.
 *
 * As with Python, doing this BEFORE the seeder is what preserves the slug: the
 * seeder resolves "Musical Instruments > Guitar" by name-plus-parent, and on a
 * server where Guitar is still at the root that lookup would miss and create a
 * second Guitar as `guitar-<parentId>`, changing a public URL.
 */
return new class extends Migration
{
    /** child name => the top-level section it belongs under */
    private const MOVES = [
        'Guitar'         => 'Musical Instruments',
        'Piano'          => 'Musical Instruments',
        'Spoken English' => 'Languages',
    ];

    public function up(): void
    {
        if (!Schema::hasTable('categories')) return;

        foreach (self::MOVES as $child => $parent) {
            $parentId = DB::table('categories')
                ->whereNull('parent_id')->where('name', $parent)->value('id');
            if (!$parentId) continue;               // fresh install — seeder builds it

            // Only a row still at the root, and never one already correctly
            // nested somewhere else.
            DB::table('categories')
                ->whereNull('parent_id')->where('name', $child)
                ->update(['parent_id' => $parentId, 'updated_at' => now()]);
        }
    }

    /** Irreversible on purpose — putting them back would restore the defect. */
    public function down(): void
    {
        // no-op
    }
};
