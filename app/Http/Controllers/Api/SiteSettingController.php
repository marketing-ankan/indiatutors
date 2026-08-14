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
