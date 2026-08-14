<?php
namespace App\Support;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * One-time import of the 19 group classes from the JSON the page used to read.
 *
 * Called from two places because neither alone is sufficient:
 *
 *  - the migration, which covers an EXISTING database (production): the courses
 *    are already there when it runs, so the cards match rows and the import
 *    lands;
 *  - GroupClassSeeder, which covers a FRESH database: `migrate:fresh --seed`
 *    runs every migration BEFORE the first seeder, so at migration time the
 *    courses table is empty, every card is skipped, and the site comes up with
 *    an empty /group-classes and no error anywhere.
 *
 * Both entry points call this, and this is idempotent — it returns immediately
 * once any group course exists — so running both is a no-op, and the database
 * stays authoritative the moment the owner edits anything in the console.
 */
class GroupClassImporter
{
    /** @return int number of courses flagged as group classes */
    public static function import(): int
    {
        if (!Schema::hasTable('courses') || !Schema::hasColumn('courses', 'is_group')
            || !Schema::hasTable('course_batches')) {
            return 0;
        }

        // Already imported, or the owner has since curated the list. Either way,
        // the database wins.
        if (DB::table('courses')->where('is_group', true)->exists()) {
            return 0;
        }

        $path = base_path('database/data/group-classes.json');
        if (!is_file($path)) {
            return 0;
        }

        $data = json_decode((string) file_get_contents($path), true);
        $count = 0;

        foreach ($data['cards'] ?? [] as $card) {
            $slug = $card['slug'] ?? null;
            if (!$slug) continue;

            $course = DB::table('courses')->where('slug', $slug)->first();
            if (!$course) continue;     // a card with no catalogue row is skipped, never invented

            // chips are positional, emoji-prefixed: [batches done, ongoing, age, weeks]
            $age   = isset($card['chips'][2]) ? trim(preg_replace('~^\S+\s*~u', '', $card['chips'][2])) : null;
            $weeks = isset($card['chips'][3]) && preg_match('~(\d+)~', $card['chips'][3], $m) ? (int) $m[1] : null;

            DB::table('courses')->where('id', $course->id)->update([
                'is_group'             => true,
                'group_about'          => $card['about'] ?? null,
                'group_highlights'     => json_encode($card['hi'] ?? []),
                'group_age_range'      => $age,
                'group_duration_weeks' => $weeks,
                // batches_done / ongoing_batches deliberately left NULL — the
                // figures in the JSON ("119 Batches done", "16 Ongoing") are
                // invented and frozen, and a blank field renders no chip.
                'updated_at'           => now(),
            ]);
            $count++;

            foreach ($card['levels'] ?? [] as $j => $level) {
                // "Sat-Sun · 10:00–11:00 AM IST" -> days / time / timezone
                $parts = array_map('trim', preg_split('~\s*·\s*~u', (string) ($level['schedule'] ?? '')));
                $days  = $parts[0] ?? null;
                $rest  = $parts[1] ?? '';
                $tz    = preg_match('~\b([A-Z]{2,4})\s*$~', $rest, $m) ? $m[1] : 'IST';
                $time  = trim(preg_replace('~\b[A-Z]{2,4}\s*$~', '', $rest)) ?: null;

                DB::table('course_batches')->insert([
                    'course_id'     => $course->id,
                    'name'          => $level['name'] ?? 'Batch',
                    'schedule_days' => $days ?: null,
                    'schedule_time' => $time,
                    'timezone'      => $tz,
                    'seats_total'   => null,     // the per-level "N students" counts are invented
                    'position'      => $j,
                    'created_at'    => now(),
                    'updated_at'    => now(),
                ]);
            }
        }

        return $count;
    }
}
