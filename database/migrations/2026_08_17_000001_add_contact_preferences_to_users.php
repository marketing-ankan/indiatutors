<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * How this person wants to be contacted — on their account, not on one form.
 *
 * WhatsApp and marketing consent were collected once, in the demo-booking
 * form, and stored against that booking. Nothing carried them onto the user.
 * So a parent had no way to say "message me on WhatsApp, not email", to ask
 * for a reminder before class, or to stop marketing — and the business had no
 * single place to check what any given person had actually agreed to before
 * messaging them. On an India-first platform, where WhatsApp is the channel
 * families actually read, that is the gap that matters.
 *
 * Two kinds of switch, deliberately separated:
 *   - SERVICE messages (a proposed demo time, a substitute teacher, a class
 *     reminder) default ON. Someone who booked a class expects to be told
 *     about that class.
 *   - MARKETING defaults OFF and is only ever on because the person said yes.
 *     A default-on marketing flag is not consent.
 *
 * The backfill honours consent already given rather than assuming it: where a
 * user has booked a demo, their latest booking's whatsapp_consent and
 * marketing_consent are carried across. It runs inside the column guard, so a
 * deploy killed mid-migration leaves the conservative defaults rather than
 * re-running later and overwriting a preference the person has since changed.
 */
return new class extends Migration {
    public function up(): void {
        if (Schema::hasColumn('users', 'notify_whatsapp')) return;

        Schema::table('users', function (Blueprint $t) {
            $t->boolean('notify_whatsapp')->default(true)->after('phone_country_code');
            $t->boolean('notify_email')->default(true)->after('notify_whatsapp');
            $t->boolean('class_reminders')->default(true)->after('notify_email');
            $t->boolean('marketing_opt_in')->default(false)->after('class_reminders');
        });

        if (! Schema::hasTable('demo_requests')) return;

        // Latest booking per user wins: it is the most recent thing they said.
        $latest = DB::table('demo_requests')
            ->whereNotNull('user_id')
            ->orderBy('id')
            ->get(['user_id', 'whatsapp_consent', 'marketing_consent']);

        $seen = [];
        foreach ($latest as $row) {
            $seen[$row->user_id] = $row;
        }

        foreach ($seen as $userId => $row) {
            DB::table('users')->where('id', $userId)->update([
                'notify_whatsapp'  => (bool) $row->whatsapp_consent,
                'marketing_opt_in' => (bool) $row->marketing_consent,
            ]);
        }
    }

    public function down(): void {
        if (! Schema::hasColumn('users', 'notify_whatsapp')) return;
        Schema::table('users', function (Blueprint $t) {
            $t->dropColumn(['notify_whatsapp', 'notify_email', 'class_reminders', 'marketing_opt_in']);
        });
    }
};
