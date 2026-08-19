<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * winquestnline.com -> winquestonline.com. The "o" was missing.
 *
 * The two staff accounts were created from addresses supplied by hand, and the
 * domain was typed without its "o". It was queried at the time and confirmed as
 * written, so it shipped as given; the owner has now corrected it. Signing in
 * never depended on the domain resolving — an address is just an identifier
 * here — which is exactly why it survived unnoticed: nothing breaks until the
 * day it needs to receive mail, and by then it is a password reset that
 * silently goes nowhere.
 *
 * A NEW migration rather than an edit to the one that created them. That one
 * has already run everywhere it will ever run, so editing it would change
 * nothing on this server while quietly rewriting the record of what actually
 * happened. On a rebuilt database the pair still runs in order: the first
 * creates the addresses as they were, this one corrects them.
 *
 * Every step is conditional, so this is safe to re-run and safe on a database
 * where somebody has already fixed it by hand in the console.
 */
return new class extends Migration {
    private const RENAMES = [
        'dinesh@winquestnline.com' => 'dinesh@winquestonline.com',
        'seema@winquestnline.com'  => 'seema@winquestonline.com',
    ];

    public function up(): void
    {
        foreach (self::RENAMES as $old => $new) {
            // Nothing to do if the correct address is already in use — either
            // this ran before, or a human fixed it from the Users tab. Renaming
            // into an address that exists would violate the unique index and
            // take the whole deploy's migrate step down with it.
            if (DB::table('users')->where('email', $new)->exists()) continue;

            DB::table('users')->where('email', $old)->update(['email' => $new]);

            // Alternate sign-in addresses, if that table has been created yet:
            // a stale row here would keep the old address working as a login.
            if (Schema::hasTable('user_emails')
                && ! DB::table('user_emails')->where('email', $new)->exists()) {
                DB::table('user_emails')->where('email', $old)->update(['email' => $new]);
            }
        }
    }

    /**
     * Left alone. Rolling back a schema change is one thing; handing two people
     * back an address with a typo in it is another, and their password would
     * not change either way.
     */
    public function down(): void
    {
        //
    }
};
