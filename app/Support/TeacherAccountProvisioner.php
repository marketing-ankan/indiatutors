<?php

namespace App\Support;

use App\Models\AuditLog;
use App\Models\TeacherProfile;
use App\Models\Tutor;
use App\Models\User;
use App\Models\UserEmail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * Gives the already-listed teachers a way to sign in.
 *
 * Teachers seeded before accounts existed have a public listing and no login:
 * tutors.user_id is NULL and the tutors table carries no email column, so there
 * is no identity to derive one from. This mints one account per listing, links
 * it, and seeds the private profile FROM the listing so a teacher's first
 * sign-in shows their real details rather than a blank form they might save
 * over the top of.
 *
 * Shared by the artisan command and the Staff Console button so the two can
 * never drift into behaving differently.
 */
class TeacherAccountProvisioner
{
    /**
     * @return array{created: array<int, array{name:string,email:string,password:string}>,
     *               skipped: array<int, array{name:string,email:string,reason:string}>}
     *
     * Plaintext passwords are returned because the caller has to deliver them —
     * there is no mail to send them with. Callers must show them once and never
     * persist or log them.
     */
    public static function run(string $domain, bool $dryRun = false): array
    {
        $created = [];
        $skipped = [];

        foreach (Tutor::whereNull('user_id')->orderBy('id')->get() as $tutor) {
            $email = Str::slug($tutor->slug ?: $tutor->name) . '@' . $domain;

            $taken = User::where('email', $email)->exists()
                || (Schema::hasTable('user_emails') && UserEmail::where('email', $email)->exists());
            if ($taken) {
                $skipped[] = ['name' => $tutor->name, 'email' => $email, 'reason' => 'address already in use'];
                continue;
            }

            if ($dryRun) {
                $created[] = ['name' => $tutor->name, 'email' => $email, 'password' => ''];
                continue;
            }

            // Readable but not guessable — a human has to relay these by hand.
            $password = Str::password(14, symbols: false);

            DB::transaction(function () use ($tutor, $email, $password, &$created) {
                $user = User::create([
                    'name'     => $tutor->name,
                    'email'    => $email,
                    'password' => $password,      // hashed by the model cast
                    'role'     => 'teacher',
                ]);

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
                    // Already public. 'pending' would drop a live teacher back
                    // into the approval queue.
                    'status'           => 'approved',
                ]);

                $tutor->forceFill(['user_id' => $user->id])->save();

                // The password is deliberately NOT in the audit entry.
                AuditLog::record('teacher_account_provisioned', 'tutor', $tutor->id, $tutor->slug, [
                    'user_id' => $user->id,
                    'email'   => $email,
                ]);

                $created[] = ['name' => $tutor->name, 'email' => $email, 'password' => $password];
            });
        }

        return ['created' => $created, 'skipped' => $skipped];
    }

    /** How many listings are still without a login. */
    public static function pendingCount(): int
    {
        return Tutor::whereNull('user_id')->count();
    }
}
