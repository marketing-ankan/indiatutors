<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Lets an approved review reach the home page.
 *
 * The owner agreed to keep the placeholder testimonials on one condition: that
 * a parent's review could be submitted, sit unapproved, be approved by staff,
 * and then appear on the site — with the invented ones retiring "one by one" as
 * real ones arrive. Moderation was built; the second half was not. An approved
 * review had nowhere to go: the home page renders a hardcoded array, and the
 * table had no column to mark one for publication.
 *
 * `is_featured` is that column. Approval alone is deliberately NOT enough:
 * every approved review already shows on its own course page, while the home
 * page carousel is a shortlist somebody chooses. Making approval publish to the
 * home page would put the next routine 5-star course review on the front page
 * unasked.
 *
 * `author_role` is the line under the name ("Parent, Kolkata · Class 8 Maths").
 * The placeholders carry one and a real review has no equivalent field, so
 * without it every genuine testimonial would render visibly poorer than the
 * invented ones it is meant to replace.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('reviews')) return;

        Schema::table('reviews', function (Blueprint $t) {
            if (!Schema::hasColumn('reviews', 'is_featured')) {
                $t->boolean('is_featured')->default(false);
            }
            if (!Schema::hasColumn('reviews', 'author_role')) {
                $t->string('author_role', 120)->nullable();
            }
        });

        // The home page asks for "featured and approved, newest first".
        //
        // Guarded on the INDEX, not the column. This host kills `migrate` partway
        // through (see deploy/deploy.sh), and MySQL DDL is not transactional — so
        // a run killed after the ALTER but before Laravel logs the migration
        // re-enters here with the column already present. Guarding on the column
        // would then re-add an index that exists and raise "Duplicate key name",
        // wedging that migration and every one queued behind it on every
        // subsequent deploy. Same reasoning, and the same helper, as
        // 2026_08_07_000003_teacher_reviews_gated_on_demos.php on this table.
        if (Schema::hasColumn('reviews', 'is_featured')
            && !self::hasIndex('reviews', 'reviews_is_featured_status_index')) {
            Schema::table('reviews', function (Blueprint $t) {
                $t->index(['is_featured', 'status']);
            });
        }
    }

    /** Portable index check — tests run on sqlite, production is MySQL. */
    private static function hasIndex(string $table, string $index): bool
    {
        try {
            $driver = Schema::getConnection()->getDriverName();
            if ($driver === 'sqlite') {
                return collect(Schema::getConnection()->select("PRAGMA index_list('{$table}')"))
                    ->contains(fn ($r) => ($r->name ?? null) === $index);
            }
            return collect(Schema::getConnection()->select("SHOW INDEX FROM `{$table}`"))
                ->contains(fn ($r) => ($r->Key_name ?? null) === $index);
        } catch (\Throwable $e) {
            // "Cannot tell" must mean "exists", so a retry never dies here.
            return true;
        }
    }

    public function down(): void
    {
        if (!Schema::hasTable('reviews')) return;

        // The index is dropped on its own guard: a partial state with the column
        // but no index would otherwise throw here too.
        if (self::hasIndex('reviews', 'reviews_is_featured_status_index')) {
            Schema::table('reviews', fn (Blueprint $t) => $t->dropIndex('reviews_is_featured_status_index'));
        }

        Schema::table('reviews', function (Blueprint $t) {
            if (Schema::hasColumn('reviews', 'is_featured'))  $t->dropColumn('is_featured');
            if (Schema::hasColumn('reviews', 'author_role')) $t->dropColumn('author_role');
        });
    }
};
