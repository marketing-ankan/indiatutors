<?php

namespace App\Console\Commands;

use App\Support\TeacherAccountProvisioner;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

/**
 * Command-line front end for TeacherAccountProvisioner. The Staff Console has a
 * button that runs exactly the same service, for when there is no shell.
 *
 * Passwords go to a file, never to the terminal: scrollback is the easiest place
 * in this chain for them to leak from. storage/app/private/.gitignore is `*`, so
 * a credentials file cannot reach the public repo.
 */
class ProvisionTeacherAccounts extends Command
{
    protected $signature = 'teachers:provision
        {--domain=indiatutorsonline.com : Domain for the placeholder addresses}
        {--dry-run : Show what would happen and write nothing}';

    protected $description = 'Create sign-in accounts for teachers who are listed publicly but have no login';

    public function handle(): int
    {
        $dry = (bool) $this->option('dry-run');

        if (TeacherAccountProvisioner::pendingCount() === 0) {
            $this->info('Every public listing already has an account. Nothing to do.');
            return self::SUCCESS;
        }

        $result = TeacherAccountProvisioner::run(trim((string) $this->option('domain')), $dry);

        if ($result['skipped']) {
            $this->newLine();
            $this->warn('Skipped:');
            $this->table(['teacher', 'address', 'reason'],
                array_map(fn ($r) => [$r['name'], $r['email'], $r['reason']], $result['skipped']));
        }

        if (! $result['created']) {
            $this->info('No accounts created.');
            return self::SUCCESS;
        }

        if ($dry) {
            $this->newLine();
            $this->table(['teacher', 'address'],
                array_map(fn ($r) => [$r['name'], $r['email']], $result['created']));
            $this->info('Dry run — nothing was written.');
            return self::SUCCESS;
        }

        $path = 'teacher-logins-' . now()->format('Ymd-His') . '.csv';
        $csv  = "teacher,email,password\n";
        foreach ($result['created'] as $r) {
            $csv .= '"' . str_replace('"', '""', $r['name']) . "\",{$r['email']},{$r['password']}\n";
        }
        $disk = Storage::disk('local');
        $disk->put($path, $csv);

        $this->newLine();
        $this->info('Created ' . count($result['created']) . ' account(s).');
        // The real path: the local disk roots at storage/app/private on Laravel 11,
        // and printing storage/app/... sends you hunting for a file that is not there.
        $this->line('Credentials written to: ' . $disk->path($path));
        $this->warn('Passwords are NOT shown here on purpose. Fetch that file, hand each teacher their own line, then delete it.');
        $this->line('Each teacher should replace the placeholder address via Account > Sign-in addresses.');

        return self::SUCCESS;
    }
}
