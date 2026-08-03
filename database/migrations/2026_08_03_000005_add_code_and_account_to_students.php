<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// Two things the console needs from a student row.
//
// `code` — a stable, printable identifier (STU-100514). Stored rather than
// derived from the id: the codes end up in emails and on paperwork, and a
// derived one would silently renumber everybody if the table were ever reseeded.
//
// `account_user_id` — a student's OWN login, distinct from `user_id`, which
// stays the guardian who created the profile. Without it a student-role account
// has no way to reach its own enrolments, and the student dashboard would have
// nothing honest to show.
return new class extends Migration {
    public function up(): void {
        if (!Schema::hasColumn('students', 'code')) {
            Schema::table('students', function (Blueprint $t) {
                $t->string('code', 20)->nullable()->unique()->after('id');
            });
        }
        if (!Schema::hasColumn('students', 'account_user_id')) {
            Schema::table('students', function (Blueprint $t) {
                $t->foreignId('account_user_id')->nullable()->after('user_id')
                    ->constrained('users')->nullOnDelete();
            });
        }

        // Backfilled in PHP, not SQL: the app runs on MySQL and the tests on
        // sqlite, and string concatenation is spelled differently in each.
        // chunkById, not chunk: the update clears the whereNull filter as it
        // goes, and offset paging would skip every other page.
        DB::table('students')->whereNull('code')->select('id')->chunkById(500, function ($rows) {
            foreach ($rows as $row) {
                DB::table('students')->where('id', $row->id)->update(['code' => 'STU-' . (100000 + $row->id)]);
            }
        });
    }

    public function down(): void {
        Schema::table('students', function (Blueprint $t) {
            $t->dropConstrainedForeignId('account_user_id');
            $t->dropColumn('code');
        });
    }
};
