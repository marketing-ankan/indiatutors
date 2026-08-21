<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\SiteSettings;

/**
 * The public read of the site-wide details — phone, email, address, socials.
 *
 * Public because the header and footer render on every page including for
 * signed-out visitors. Only the whitelisted display fields are exposed; this is
 * not a window onto the settings table, which also holds seeder fingerprints.
 */
class SiteSettingController extends Controller
{
    /**
     * What is actually deployed and configured — the observable facts, because
     * this host has no shell and every question about production state has had
     * to be answered by guesswork against bundle hashes and served files.
     *
     * The deploy writes two markers: assets.sha when the front-end copy for a
     * commit completed, db.sha when its migrations and seeders all succeeded.
     * Reading both here answers "which commit is live" AND "has the DB work for
     * it finished" — the two halves advance independently by design.
     *
     * Config values are reported as BOOLEANS only. Whether an admin password is
     * configured is not a secret; the password is, and it never leaves here.
     */
    public function deployInfo()
    {
        $mark = fn (string $f) => trim((string) @file_get_contents(
            storage_path('app/deploy-state/' . $f)
        )) ?: null;

        return response()->json(['data' => [
            'assets_commit' => $mark('assets.sha'),
            'db_commit'     => $mark('db.sha'),
            'admin_password_configured' => (bool) config('app.admin_password'),
            // If true, every deploy re-forces the configured password — with a
            // wrong value in .env that would silently clobber any password fixed
            // through the console, so it must be visible.
            'admin_password_reset_active' => (bool) config('app.admin_password_reset'),
            'mail_mailer'   => (string) config('mail.default'),
            'ga_configured' => (bool) config('app.ga_id'),
            // Whether the Content tab can offer the writing assistant at all.
            'ai_configured' => (bool) config('services.ai.key'),

            // Why nobody can sign in, narrowed without exposing anything.
            //
            // login() answers an identical 422 for "no such account" and "wrong
            // password", which is correct — telling an attacker which addresses
            // exist is an enumeration gift — but it also means the lockout
            // cannot be diagnosed from outside at all. These two say which of
            // the three possible causes it is, and neither echoes an address or
            // a secret: a count, and a state for whatever ADMIN_EMAIL happens
            // to be set to on this server.
            //
            //   admin_count 0            -> no admin exists; the seeder never ran
            //   admin_email_account
            //     'missing'              -> ADMIN_EMAIL points at an address with
            //                               no account, so the unlock migration
            //                               force-set the password on something
            //                               else entirely
            //     'exists_not_admin'     -> the account is there but not staff
            //     'admin'                -> account and role are both right, so
            //                               the only remaining cause is that
            //                               ADMIN_PASSWORD is not the password
            //                               being typed
            'admin_count' => \App\Models\User::where('role', 'admin')->count(),
            'admin_email_account' => (function () {
                $email = config('app.admin_email');
                if (! $email) return 'not_configured';
                $user = \App\Models\User::where('email', $email)->first();
                if (! $user) return 'missing';
                return $user->role === 'admin' ? 'admin' : 'exists_not_admin';
            })(),
        ]]);
    }

    public function index()
    {
        $all = SiteSettings::all();

        return response()->json(['data' => [
            'entity_name'      => $all['entity_name'],
            'contact_phone'    => $all['contact_phone'],
            // Derived so the console only ever asks for the number once, in the
            // form a human reads. Spaces and dashes are not valid in a tel: URI.
            'contact_phone_href' => $all['contact_phone']
                ? 'tel:' . preg_replace('/[^\d+]/', '', $all['contact_phone'])
                : null,
            'contact_email'    => $all['contact_email'],
            'contact_address'  => $all['contact_address'],
            'contact_locality' => $all['contact_locality'],
            'footer_blurb'     => $all['footer_blurb'],
            // Whether the recorded-course catalogue is open for business. Read
            // by every video course page, so it has to cross this whitelist —
            // adding the key to SiteSettings::FIELDS alone is not enough, and
            // omitting it here left the front end permanently on its fallback,
            // which happens to be "coming soon" and so looked like it worked.
            'video_courses_status' => $all['video_courses_status'] ?: 'coming_soon',
            'socials'          => [
                'whatsapp'  => $all['whatsapp_url'],
                'facebook'  => $all['facebook_url'],
                'instagram' => $all['instagram_url'],
                'youtube'   => $all['youtube_url'],
                'linkedin'  => $all['linkedin_url'],
                'twitter'   => $all['twitter_url'],
            ],
        ]]);
    }
}
