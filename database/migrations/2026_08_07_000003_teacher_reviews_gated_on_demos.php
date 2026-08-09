<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
| Stage 2 / D1 — teacher reviews, gated on a demo that actually happened.
|
| Extends the existing `reviews` table rather than adding a sibling, for the
| reason its own migration gives: "a single moderation queue is the point."
| Staff moderate course and teacher reviews in one place.
|
| THE GATE IS `demo_request_id`, NOT A PERMISSION CHECK. A teacher review is
| about a specific demo the reviewer sat, so the demo is the natural key:
|
|   - it proves the reviewer met this teacher (Stage 1's completed_at),
|   - it makes "one review per demo" a UNIQUE INDEX rather than application
|     logic that can be raced by a double-submit,
|   - and it means a review can never be written for a teacher the reviewer
|     never actually had a class with.
|
| The existing table has NO unique constraints at all and no "already reviewed"
| check, so this is the first uniqueness rule on it. The index is on
| demo_request_id alone, not (demo_request_id, tutor_id): one demo yields one
| review, full stop — pairing it with the tutor would let a reassignment
| produce a second review for the same class.
|
| Cautionary note taken from `video_course_id`, which sits in this table, in
| $fillable, and in the API resource, but which NO code path ever writes — a
| target column with no write path is dead weight that looks alive. Both
| columns added here are written by ReviewController::storeForTutor in the same
| commit.
*/
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('reviews')) {
            return;
        }

        Schema::table('reviews', function (Blueprint $t) {
            if (! Schema::hasColumn('reviews', 'tutor_id')) {
                $t->foreignId('tutor_id')->nullable()->constrained()->nullOnDelete();
            }
            // nullOnDelete rather than cascade: deleting a booking must not
            // silently destroy a published review. It orphans the gate, which
            // is fine — the review has already been moderated by then.
            if (! Schema::hasColumn('reviews', 'demo_request_id')) {
                $t->foreignId('demo_request_id')->nullable()->constrained()->nullOnDelete();
            }
        });

        // Separate statement so a killed-and-retried deploy cannot hit a
        // duplicate-index error (see deploy/deploy.sh).
        if (Schema::hasColumn('reviews', 'demo_request_id')
            && ! self::hasIndex('reviews', 'reviews_demo_request_id_unique')) {
            Schema::table('reviews', fn (Blueprint $t) => $t->unique('demo_request_id'));
        }
        if (Schema::hasColumn('reviews', 'tutor_id')
            && ! self::hasIndex('reviews', 'reviews_tutor_id_status_index')) {
            Schema::table('reviews', fn (Blueprint $t) => $t->index(['tutor_id', 'status']));
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('reviews')) {
            return;
        }
        if (Schema::hasColumn('reviews', 'demo_request_id')) {
            Schema::table('reviews', function (Blueprint $t) {
                $t->dropForeign(['demo_request_id']);
                $t->dropUnique('reviews_demo_request_id_unique');
                $t->dropColumn('demo_request_id');
            });
        }
        if (Schema::hasColumn('reviews', 'tutor_id')) {
            Schema::table('reviews', function (Blueprint $t) {
                $t->dropForeign(['tutor_id']);
                $t->dropIndex('reviews_tutor_id_status_index');
                $t->dropColumn('tutor_id');
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
};
