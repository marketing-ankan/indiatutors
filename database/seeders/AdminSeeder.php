<?php
namespace Database\Seeders;
use App\Models\User;
use Illuminate\Database\Seeder;

class AdminSeeder extends Seeder {
    public function run(): void {
        // Security: never create a default-password admin. Require an explicit
        // ADMIN_PASSWORD in .env; otherwise skip (no admin login until set).
        //
        // config(), NOT env(). The production deploy runs config:cache, and
        // under a cached config .env is never loaded — env() here returned
        // null on every server run, so this seeder silently skipped forever
        // and the live site had no admin while the identical code worked on
        // every dev machine. The values ride in via config/app.php, which the
        // cache bakes at deploy time.
        $password = config('app.admin_password');
        if (!$password) {
            $this->command->warn('AdminSeeder skipped — set ADMIN_EMAIL + ADMIN_PASSWORD in .env to create the admin user.');
            return;
        }
        // firstOrCreate (not updateOrCreate) so a changed password is never reset on deploy.
        $admin = User::firstOrCreate(
            ['email' => config('app.admin_email')],
            ['name' => 'IndiaTutors Admin', 'password' => $password, 'role' => 'admin']
        );
        if ($admin->role !== 'admin') $admin->update(['role' => 'admin']);

        // One-shot password reset, for the case firstOrCreate cannot solve.
        //
        // If that address already exists as a user — likely, since it is the
        // owner's own and may have registered as a parent long before the
        // console existed — the line above finds it and leaves the password
        // alone. That is the right default: a deploy must never silently reset a
        // password someone has since changed. But it also means a correctly-set
        // ADMIN_PASSWORD can appear to do nothing, with no way in and no shell
        // on this host to fix it.
        //
        // So the reset is explicit and opt-in. Set ADMIN_PASSWORD_RESET=true in
        // the server .env, let one deploy run, sign in, then REMOVE the flag —
        // while it is set, every deploy overwrites the password, which would
        // undo a change made in the console.
        if (filter_var(config('app.admin_password_reset'), FILTER_VALIDATE_BOOLEAN)) {
            $admin->forceFill(['password' => $password])->save();
            $this->command->warn('AdminSeeder: password RESET for '.$admin->email.' — remove ADMIN_PASSWORD_RESET from .env now.');
        }

        $this->command->info('Admin user ensured: ' . $admin->email);

        $this->promoteRecoveryAccount();
    }

    /**
     * TEMPORARY recovery path — remove once the three admin accounts work.
     *
     * Production is locked out: the server's configured ADMIN_PASSWORD is not
     * the value the owner intends (a stale or duplicate .env line), so the
     * one-shot unlock migration faithfully applied the wrong password, and this
     * host has no shell. Every remaining fix needs one working admin login.
     *
     * The bootstrap: the owner registers this exact address through the site's
     * PUBLIC registration form, choosing the password there — so the password
     * travels over HTTPS to the server and never appears in this repository.
     * This seeder then promotes the account on the next deploy. Promotion is
     * role-only and idempotent; if the account does not exist yet it does
     * nothing and simply tries again next cycle.
     *
     * Hardcoding the address is safe precisely because it is a plus-alias of
     * the owner's own Gmail — only the owner's inbox can receive for it.
     */
    private function promoteRecoveryAccount(): void
    {
        $recovery = User::where('email', 'marketing.freelancer2026+admin@gmail.com')->first();

        if ($recovery && $recovery->role !== 'admin') {
            $recovery->update(['role' => 'admin']);
            $this->command->warn('AdminSeeder: recovery account promoted to admin.');
        }
    }
}
