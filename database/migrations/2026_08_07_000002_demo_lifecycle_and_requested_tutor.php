<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
| Stage 1 of the demo -> review -> ranking flywheel (docs/ECOSYSTEM-PLAN.md).
|
| Two facts the schema could not previously express, both of which everything
| downstream depends on:
|
| 1. DID THE DEMO ACTUALLY HAPPEN?  The old vocabulary was new / scheduled /
|    converted / closed. `converted` means the family BOUGHT, not that the demo
|    took place, and `closed` is used for every kind of ending. So a demo that
|    was held and simply did not convert was indistinguishable from one that was
|    never held at all. That is precisely the case the ranking must see: it is
|    the denominator of the conversion rate, and it is what the review gate
|    ("5 stars only after a successful demo") has to check. Hence `completed_at`
|    — a timestamp rather than a status lookup, so the fact survives any later
|    status change and can be reported on by date.
|
| 2. WHICH TEACHER DID THE STUDENT CHOOSE?  `assigned_tutor_id` is set by staff
|    in the console. Once students pick their own teacher from the suggestions,
|    the chosen teacher and the finally-assigned tutor are different facts. If
|    they share one column, every coordinator reassignment silently moves the
|    conversion credit to the wrong teacher and the ranking quietly rots. Two
|    columns, from the start.
|
| Purely additive: no existing status value changes meaning, so live rows and
| every current filter keep working. `status` also gains the index it never had
| — the console filters on it and the new analytics count by it.
|
| hasTable/hasColumn guards throughout because this host's deploy DB step gets
| killed and retried across cron cycles (see deploy/deploy.sh).
*/
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('demo_requests')) {
            return;
        }

        Schema::table('demo_requests', function (Blueprint $t) {
            // The teacher the STUDENT picked, distinct from assigned_tutor_id.
            // nullOnDelete: losing a tutor row must not delete the lead.
            if (! Schema::hasColumn('demo_requests', 'requested_tutor_id')) {
                $t->foreignId('requested_tutor_id')->nullable()->constrained('tutors')->nullOnDelete();
            }
            // Stamped once, when the demo is first marked completed (or
            // converted, which implies it happened). Never cleared.
            if (! Schema::hasColumn('demo_requests', 'completed_at')) {
                $t->timestamp('completed_at')->nullable();
            }
        });

        // Separate statement: indexes cannot be added conditionally inside the
        // same closure without re-inspecting, and a duplicate index name is a
        // hard error that would stall the whole deploy under `set -e`.
        if (! self::hasIndex('demo_requests', 'demo_requests_status_index')) {
            Schema::table('demo_requests', fn (Blueprint $t) => $t->index('status'));
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('demo_requests')) {
            return;
        }

        if (Schema::hasColumn('demo_requests', 'requested_tutor_id')) {
            Schema::table('demo_requests', function (Blueprint $t) {
                $t->dropForeign(['requested_tutor_id']);
                $t->dropColumn('requested_tutor_id');
            });
        }
        if (Schema::hasColumn('demo_requests', 'completed_at')) {
            Schema::table('demo_requests', fn (Blueprint $t) => $t->dropColumn('completed_at'));
        }
    }

    /** Portable index check — the tests run on sqlite, production is MySQL. */
    private static function hasIndex(string $table, string $index): bool
    {
        try {
            return array_key_exists(
                $index,
                Schema::getConnection()->getDoctrineSchemaManager()->listTableIndexes($table)
            );
        } catch (\Throwable $e) {
            // No Doctrine (it is not in the committed vendor/): fall back to
            // asking the driver directly, and treat "cannot tell" as "exists"
            // so a retry never dies on a duplicate-index error.
            try {
                $driver = Schema::getConnection()->getDriverName();
                if ($driver === 'sqlite') {
                    return collect(Schema::getConnection()->select("PRAGMA index_list('{$table}')"))
                        ->contains(fn ($r) => ($r->name ?? null) === $index);
                }
                return collect(Schema::getConnection()->select("SHOW INDEX FROM `{$table}`"))
                    ->contains(fn ($r) => ($r->Key_name ?? null) === $index);
            } catch (\Throwable $e2) {
                return true;
            }
        }
    }
};
