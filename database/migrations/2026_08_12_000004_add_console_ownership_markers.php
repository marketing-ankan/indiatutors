<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Stops the deploy from destroying work done in the Staff Console.
 *
 * Both content seeders prune every row that is not in their source file and
 * then updateOrCreate over the rest:
 *
 *   PostSeeder   — Post::whereNotIn('slug', ['hello-world'])->delete()
 *   CourseSeeder — Course::whereNotIn('slug', $sourceSlugs)->delete(), then
 *                  overwrites name, price, description, image and position and
 *                  forces is_published => true
 *
 * So a blog post written in the console was deleted outright on the next cron
 * pull, a price edit silently reverted, and a deliberately unpublished course
 * republished itself. The course path is worse than a deploy-time risk: an
 * ordinary visitor can trigger it, because CourseController::selfHealCurriculum
 * re-runs the seeder through SeedFingerprint::bypass() from a product page.
 *
 * `console_edited_at` marks a row a human has taken ownership of:
 *
 *   NULL     — the seeder owns it and may update or prune it, as before.
 *   NOT NULL — someone edited it in the console. The seeder must leave it alone.
 *
 * Backfilled from the audit log, so rows edited BEFORE this migration are
 * protected too — otherwise the first deploy after this ships would still
 * revert every edit made up to now.
 */
return new class extends Migration
{
    private const TABLES = ['courses', 'posts'];

    public function up(): void
    {
        foreach (self::TABLES as $table) {
            if (Schema::hasTable($table) && !Schema::hasColumn($table, 'console_edited_at')) {
                Schema::table($table, function (Blueprint $t) {
                    $t->timestamp('console_edited_at')->nullable()->index();
                });
            }
        }

        $this->backfillFromAuditLog();
    }

    /**
     * Every console write is recorded by AuditLog::record(), so the log is an
     * accurate record of which rows a human has already touched.
     */
    private function backfillFromAuditLog(): void
    {
        if (!Schema::hasTable('audit_logs')) return;

        $map = [
            'courses' => ['course', ['course_added', 'course_updated']],
            'posts'   => ['post',   ['post_created', 'post_updated']],
        ];

        foreach ($map as $table => [$objectType, $actions]) {
            if (!Schema::hasTable($table) || !Schema::hasColumn($table, 'console_edited_at')) continue;

            $edited = DB::table('audit_logs')
                ->where('object_type', $objectType)
                ->whereIn('action', $actions)
                ->whereNotNull('object_id')
                ->groupBy('object_id')
                ->pluck(DB::raw('MAX(created_at) as at'), 'object_id');

            foreach ($edited as $id => $at) {
                DB::table($table)->where('id', $id)->update(['console_edited_at' => $at]);
            }
        }
    }

    public function down(): void
    {
        foreach (self::TABLES as $table) {
            if (Schema::hasTable($table) && Schema::hasColumn($table, 'console_edited_at')) {
                Schema::table($table, fn (Blueprint $t) => $t->dropColumn('console_edited_at'));
            }
        }
    }
};
