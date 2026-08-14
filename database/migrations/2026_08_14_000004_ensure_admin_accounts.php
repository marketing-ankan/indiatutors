<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

/**
 * Makes the three admin accounts usable on a host with no shell.
 *
 * The owner's admin address already existed on production as a user with an
 * older password, so AdminSeeder's firstOrCreate found it, promoted it, and
 * never applied ADMIN_PASSWORD — leaving a site with an admin account nobody
 * could sign into and no shell to fix it by hand. The ADMIN_PASSWORD_RESET
 * flag solves this, but it needs a .env edit plus a later removal, and the
 * .env round-trips themselves have been the failure point.
 *
 * A migration is the cleaner one-shot: it runs exactly once per environment,
 * at a known moment (after config:cache in the same deploy, so it sees the
 * current .env), and never re-fires to clobber a password changed later in
 * the console.
 *
 * NO SECRET LIVES HERE. The password comes from config('app.admin_password'),
 * i.e. the server's own .env. If that is unset, this does nothing — it cannot
 * invent a credential, and a default-password admin must never exist.
 *
 * The two named colleagues were requested by the owner on 14 Aug 2026, same
 * password as the owner's account by their explicit instruction (flagged
 * twice; their call). Created only if missing — an existing account keeps its
 * password and is merely promoted, because "ensure these people are admins"
 * must not overwrite what an account holder has since set.
 */
return new class extends Migration
{
    private const EXTRA_ADMINS = [
        'dinesh@winquestnline.com' => 'Dinesh',
        'seema@winquestnline.com'  => 'Seema',
    ];

    public function up(): void
    {
        if (!Schema::hasTable('users')) return;

        $password = config('app.admin_password');
        if (!$password) return;

        // The owner's account: create it if missing, and apply the configured
        // password THIS ONCE even if it exists. That forced set is the entire
        // point — firstOrCreate alone is what left production locked out. The
        // 'hashed' cast on User hashes it on assignment.
        $owner = User::firstOrCreate(
            ['email' => config('app.admin_email')],
            ['name' => 'IndiaTutors Admin', 'password' => $password, 'role' => 'admin']
        );
        if ($owner->role !== 'admin') $owner->update(['role' => 'admin']);
        $owner->forceFill(['password' => $password])->save();

        foreach (self::EXTRA_ADMINS as $email => $name) {
            $extra = User::firstOrCreate(
                ['email' => $email],
                ['name' => $name, 'password' => $password, 'role' => 'admin']
            );
            if ($extra->role !== 'admin') $extra->update(['role' => 'admin']);
        }
    }

    /** Removing admin access is a decision for a human in the console, not a rollback. */
    public function down(): void
    {
        // no-op
    }
};
