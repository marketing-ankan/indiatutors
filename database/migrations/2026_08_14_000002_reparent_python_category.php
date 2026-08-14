<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Moves the "Python" category under "IT Technologies", keeping its row and slug.
 *
 * The WordPress export gave eleven courses FLAT category chains where the rest
 * of the catalogue is hierarchical: the Python course was tagged
 * ["IT Technologies", "Python"] — two sibling roots — rather than the single
 * chain "IT Technologies > Python". So Python sat at the top level and appeared
 * in the /group-classes sidebar as a peer of IT Technologies, holding one course
 * while IT Technologies held the rest.
 *
 * courses.json is fixed too, and this migration exists because fixing it alone
 * is not enough. CourseSeeder resolves "IT Technologies > Python" by looking for
 * a category named Python whose parent IS IT Technologies. On a server where
 * Python already exists at the root, that lookup misses and the seeder CREATES a
 * second Python — and because the root still holds the `python` slug, the new
 * child is created as `python-<parentId>`. That would change a public URL
 * (/courses?category=python) and split the two Python courses across two
 * categories.
 *
 * Re-parenting the existing row first means the seeder finds it, keeps the slug
 * and moves nothing. Migrations run before seeders in deploy.sh, so the order
 * holds. On a fresh install there is no Python row yet, this does nothing, and
 * the corrected chains build the right shape from the start.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('categories')) return;

        $parentId = DB::table('categories')
            ->whereNull('parent_id')->where('name', 'IT Technologies')->value('id');
        if (!$parentId) return;                      // fresh install — nothing to move

        DB::table('categories')
            ->whereNull('parent_id')->where('name', 'Python')
            ->update(['parent_id' => $parentId, 'updated_at' => now()]);
    }

    /**
     * Deliberately irreversible. Putting Python back at the root would recreate
     * the defect, and the taxonomy is data rather than schema — nothing here
     * depends on being able to undo it.
     */
    public function down(): void
    {
        // no-op
    }
};
