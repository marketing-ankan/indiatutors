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
