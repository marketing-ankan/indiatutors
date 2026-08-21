<?php
namespace App\Support;

use App\Models\Setting;
use Illuminate\Support\Facades\Schema;

/**
 * The site-wide details that appear in the header, the footer and the policy
 * pages — phone, email, address, social links, the registered entity name.
 *
 * These were hardcoded in Header.jsx, Footer.jsx, SocialProofSections.jsx and
 * legal.js, so changing a phone number meant a code change and a deploy in four
 * places at once, with the obvious risk of changing three of them.
 *
 * DEFAULTS ARE THE VALUES THAT WERE HARDCODED. An unset key therefore renders
 * exactly what the site rendered before, which means this can ship without a
 * data migration and without a blank footer if anything goes wrong.
 *
 * The whitelist is deliberate: the settings table is a key/value store, and an
 * endpoint that writes arbitrary keys is an endpoint that can quietly set
 * anything the app ever reads from it — including SeedFingerprint's hashes,
 * which live in the same table.
 */
class SiteSettings
{
    /** key => [default, validation rule, human label] */
    public const FIELDS = [
        'entity_name'      => ['Indiatutors Online LLP', 'nullable|string|max:190', 'Registered entity name'],
        'contact_phone'    => ['+91 93308 11581', 'nullable|string|max:40', 'Phone number'],
        'contact_email'    => ['connect@indiatutorsonline.com', 'nullable|email|max:190', 'Email address'],
        'contact_address'  => ['New Town, Kolkata — 700161', 'nullable|string|max:190', 'Address (footer)'],
        'contact_locality' => ['New Town, Kolkata', 'nullable|string|max:120', 'Short address (header bar)'],
        'footer_blurb'     => [
            "India's premium online tutor marketplace — connecting students with verified experts across academics, music, coding, languages, and the arts. Based in New Town, Kolkata & serving pan-India.",
            'nullable|string|max:600', 'Footer description',
        ],
        'whatsapp_url'  => ['https://wa.me/919330811581', 'nullable|url|max:300', 'WhatsApp'],
        'facebook_url'  => ['https://www.facebook.com/indiatutorsonline', 'nullable|url|max:300', 'Facebook'],
        'instagram_url' => ['https://www.instagram.com/indiatutorsonline', 'nullable|url|max:300', 'Instagram'],
        'youtube_url'   => ['https://www.youtube.com/channel/UC9wzhXEl8sdHenhC_ZuYpgw', 'nullable|url|max:300', 'YouTube'],
        'linkedin_url'  => ['https://www.linkedin.com/company/indiatutorsonline', 'nullable|url|max:300', 'LinkedIn'],
        'twitter_url'   => ['https://twitter.com/indiatutorsonline', 'nullable|url|max:300', 'X (Twitter)'],
        // Pre-existing key, kept here so every setting has one home.
        'google_review_url' => [null, 'nullable|url|max:500', 'Google review link'],

        /**
         * Whether the recorded-course catalogue is open for business.
         *
         * 'coming_soon' shows every video course as not-yet-available and puts
         * a "which subject should we record?" form in place of the player and
         * the buy button. 'live' restores normal selling.
         *
         * A setting rather than a config constant or a code branch, because the
         * day the first course is ready is a business decision made by someone
         * who cannot deploy — and on this host a config change needs a new
         * commit to take effect, which would make launch day depend on a
         * developer being available.
         */
        'video_courses_status' => ['coming_soon', 'nullable|in:coming_soon,live', 'Recorded courses'],
    ];

    /** Every setting, falling back to what the site shipped with. */
    public static function all(): array
    {
        $stored = Schema::hasTable('settings')
            ? Setting::whereIn('key', array_keys(self::FIELDS))->pluck('value', 'key')->all()
            : [];

        $out = [];
        foreach (self::FIELDS as $key => [$default]) {
            // '' is a deliberate "hide this" — only a missing row falls back.
            $out[$key] = array_key_exists($key, $stored) && $stored[$key] !== null
                ? $stored[$key]
                : $default;
        }
        return $out;
    }

    public static function get(string $key): ?string
    {
        return self::all()[$key] ?? null;
    }

    public static function rules(): array
    {
        $rules = [];
        foreach (self::FIELDS as $key => [, $rule]) $rules[$key] = $rule;
        return $rules;
    }

    /**
     * Replace __ENTITY__ everywhere in a legal document tree.
     *
     * The registered name appears in 14 places across the four policies and the
     * E-Commerce Rules require it to be accurate, so it is substituted at render
     * from one setting rather than stored 14 times.
     */
    public static function applyEntity(mixed $value, ?string $entity = null): mixed
    {
        $entity ??= self::get('entity_name') ?? '';

        if (is_string($value)) return str_replace('__ENTITY__', $entity, $value);
        if (is_array($value))  return array_map(fn ($v) => self::applyEntity($v, $entity), $value);

        return $value;
    }
}
