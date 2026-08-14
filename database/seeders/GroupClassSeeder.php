<?php
namespace Database\Seeders;

use App\Support\GroupClassImporter;
use Illuminate\Database\Seeder;

/**
 * Flags the 19 group classes on a FRESH database.
 *
 * Must run after CourseSeeder — it matches cards to existing courses by slug and
 * skips anything it cannot find, so on an empty catalogue it would import
 * nothing. Idempotent: a no-op once any group course exists, so it never
 * overwrites what the owner has edited in the console.
 */
class GroupClassSeeder extends Seeder
{
    public function run(): void
    {
        $n = GroupClassImporter::import();
        $this->command?->info($n ? "Flagged {$n} group classes." : 'Group classes already set — nothing to do.');
    }
}
