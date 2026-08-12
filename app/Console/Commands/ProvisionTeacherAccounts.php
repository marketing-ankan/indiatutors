<?php

namespace App\Console\Commands;

use App\Models\AuditLog;
use App\Models\TeacherProfile;
use App\Models\Tutor;
use App\Models\User;
use App\Models\UserEmail;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * Gives the already-listed teachers a way to sign in.
 *
 * The teachers seeded before accounts existed have a public listing and no
 * login: tutors.user_id is NULL and the tutors table carries no email column,
 * so there is nothing to derive an identity from. This mints one account per
 * listing, links it, and seeds the teacher's private profile FROM the listing
 * so their first sign-in shows their real details rather than an empty form.
 *
 * The address is a placeholder built from the slug — it is a sign-in
 * identifier, not a mailbox. The teacher replaces it themselves through
 * Account → Sign-in addresses, which is why that had to exist first.
 *
 * Passwords are unique per teacher and never shared. They are written to a file
 * under storage/app/ and never printed, because a terminal scrollback is the
 * easiest place in this whole chain for them to leak from.
 *
 * Idempotent: a listing that already has an account, or whose address is
 * already taken, is reported and skipped. Safe to re-run.
 */
class ProvisionTeacherAccounts extends Command
{
    protected $signature = 'teachers:provision
        {--domain=indiatutorsonline.com : Domain for the placeholder addresses}
        {--dry-run : Show what would happen and write nothing}';

    protected $description = 'Create sign-in accounts for teachers who are listed publicly but have no login';

    public function handle(): int
    {
        $domain = trim((string) $this->option('domain'));
        $dry    = (bool) $this->option('dry-run');

        $listings = Tutor::whereNull('user_id')->orderBy('id')->get();
        if ($listings->isEmpty()) {
            $this->info('Every public listing already has an account. Nothing to do.');
            return self::SUCCESS;
        }

        $this->info(($dry ? '[DRY RUN] ' : '') . "Found {$listings->count()} listing(s) with no account.");

        $rows = [];
        $skipped = [];

        foreach ($listings as $tutor) {
            $email = Str::slug($tutor->slug ?: $tutor->name) . '@' . $domain;

            $taken = User::where('email', $email)->exists()
                || (Schema::hasTable('user_emails') && UserEmail::where('email', $email)->exists());
            if ($taken) {
                $skipped[] = [$tutor->slug, $email, 'address already in use'];
                continue;
            }

            // Readable but not guessable: the owner has to relay these by hand.
            $password = Str::password(14, symbols: false);

            if ($dry) {
                $rows[] = [$tutor->name, $email, '(not generated in dry run)'];
                continue;
            }

            DB::transaction(function () use ($tutor, $email, $password, &$rows) {
                $user = User::create([
                    'name'     => $tutor->name,
                    'email'    => $email,
                    'password' => $password,          // hashed by the model cast
                    'role'     => 'teacher',
                ]);

                // Seed the private profile from the public listing, so the
                // teacher's first sign-in shows what families already see. Left
                // empty, their first save could blank details that are live.
                TeacherProfile::create([
                    'user_id'          => $user->id,
                    'headline'         => $tutor->tagline,
                    'qualification'    => $tutor->qualification,
                    'subjects'         => $tutor->subjects,
                    'languages'        => $tutor->languages,
                    'experience_years' => $tutor->experience_years,
                    'fee_hourly'       => $tutor->fee_hourly,
                    'city'             => $tutor->city,
                    'teaching_mode'    => $tutor->teaching_mode,
                    'service_areas'    => $tutor->localities,
                    'bio'              => $tutor->bio,
                    // Already public — anything else would put a live teacher
                    // back in the approval queue.
                    'status'           => 'approved',
                ]);

                $tutor->forceFill(['user_id' => $user->id])->save();

                AuditLog::record('teacher_account_provisioned', 'tutor', $tutor->id, $tutor->slug, [
                    'user_id' => $user->id,
                    'email'   => $email,
                ]);

                $rows[] = [$tutor->name, $email, $password];
            });
        }

        if ($skipped) {
            $this->newLine();
            $this->warn('Skipped:');
            $this->table(['listing', 'address', 'reason'], $skipped);
        }

        if (! $rows) {
            $this->info('No accounts created.');
            return self::SUCCESS;
        }

        if ($dry) {
            $this->newLine();
            $this->table(['teacher', 'address', 'password'], $rows);
            $this->info('Dry run — nothing was written.');
            return self::SUCCESS;
        }

        // Deliberately a file, not the screen.
        $path = 'teacher-logins-' . now()->format('Ymd-His') . '.csv';
        $csv  = "teacher,email,password\n";
        foreach ($rows as [$name, $email, $password]) {
            $csv .= '"' . str_replace('"', '""', $name) . "\",{$email},{$password}\n";
        }
        $disk = \Illuminate\Support\Facades\Storage::disk('local');
        $disk->put($path, $csv);

        $this->newLine();
        $this->info("Created " . count($rows) . " account(s).");
        // The real path, not a guess: the local disk roots at storage/app/private
        // on Laravel 11, and printing storage/app/... sends you hunting.
        $this->line('Credentials written to: ' . $disk->path($path));
        $this->warn('Passwords are NOT shown here on purpose. Fetch that file, hand each teacher their own line, then delete it.');
        $this->line('Each teacher should replace the placeholder address via Account → Sign-in addresses.');

        return self::SUCCESS;
    }
}
