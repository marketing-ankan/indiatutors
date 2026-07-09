<?php
namespace App\Support;

use App\Models\Course;
use App\Models\Tutor;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SeoMeta {
    private const SITE = 'Indiatutors Online';
    private const DEFAULT_DESC = 'Live 1-on-1 classes, group sessions, and self-paced video courses across Academics, Coding, Music, Dance, Languages & more — taught by verified tutors.';

    /** Build the meta bag (title/description/OG + JSON-LD) for the current path. */
    public static function for(Request $request): array {
        $base = rtrim(config('app.url'), '/');
        $path = trim($request->path(), '/');
        $canonical = $base . ($path === '' ? '/' : '/' . $path);

        $meta = self::resolve($path, $base, $canonical);
        return array_merge([
            'title'       => self::SITE . ' — Live Online Tutoring & Verified Home Tutors Across India',
            'description' => self::DEFAULT_DESC,
            'image'       => null,
            'type'        => 'website',
            'robots'      => 'index, follow',
            'site_name'   => self::SITE,
            'jsonld'      => [],
        ], $meta, ['canonical' => $canonical]);
    }

    private static function org(string $base): array {
        return ['@type' => 'Organization', 'name' => self::SITE, 'url' => $base . '/'];
    }

    private static function crumbs(string $base, array $items): array {
        return [
            '@context' => 'https://schema.org',
            '@type'    => 'BreadcrumbList',
            'itemListElement' => array_map(fn ($it, $i) => [
                '@type' => 'ListItem', 'position' => $i + 1, 'name' => $it[0], 'item' => $base . $it[1],
            ], $items, array_keys($items)),
        ];
    }

    private static function resolve(string $path, string $base, string $canonical): array {
        // Static pages
        static $statics = null;
        $statics ??= [
            ''                 => ['title' => self::SITE . ' — Live Online Tutoring & Verified Home Tutors Across India'],
            'courses'          => ['title' => 'All Courses — ' . self::SITE, 'description' => 'Browse 130+ live and self-paced courses across academics, coding, music, dance, languages and more.'],
            'find-tutors'      => ['title' => 'Find a Verified Tutor — ' . self::SITE, 'description' => 'Browse verified, qualification-checked tutors by subject, city and mode. Book a free trial class.'],
            'plans'            => ['title' => 'Plans & Pricing — ' . self::SITE, 'description' => 'Simple, honest pricing for live tutoring. First class is always free.'],
            'about'            => ['title' => 'About Us — ' . self::SITE, 'description' => "India's trusted platform for live 1-on-1 tutoring and verified home tutors."],
            'contact'          => ['title' => 'Contact — ' . self::SITE, 'description' => 'Get in touch with Indiatutors Online.'],
            'book-demo'        => ['title' => 'Book a Free Demo Class — ' . self::SITE, 'description' => 'Book a free 30-minute demo class. Meet your tutor. No payment required.'],
            'become-a-teacher' => ['title' => 'Become a Teacher — ' . self::SITE, 'description' => 'Teach on Indiatutors Online. Apply to become a verified tutor.'],
            'refer-earn'       => ['title' => 'Refer & Earn — ' . self::SITE, 'description' => 'Refer friends to Indiatutors Online and earn rewards.'],
            'login'            => ['title' => 'Login — ' . self::SITE, 'robots' => 'noindex, follow'],
            'privacy'          => ['title' => 'Privacy Policy — ' . self::SITE],
            'terms'            => ['title' => 'Terms of Service — ' . self::SITE],
            'refund'           => ['title' => 'Refund & Cancellation Policy — ' . self::SITE],
        ];
        if (array_key_exists($path, $statics)) {
            $out = $statics[$path];
            if ($path === '') {
                $out['jsonld'] = [
                    array_merge(['@context' => 'https://schema.org'], self::org($base), [
                        'description' => self::DEFAULT_DESC,
                        'contactPoint' => ['@type' => 'ContactPoint', 'contactType' => 'customer support', 'email' => 'connect@indiatutorsonline.com', 'telephone' => '+91-93308-11581'],
                    ]),
                    [
                        '@context' => 'https://schema.org', '@type' => 'WebSite', 'name' => self::SITE, 'url' => $base . '/',
                        'potentialAction' => ['@type' => 'SearchAction', 'target' => $base . '/courses?search={search_term_string}', 'query-input' => 'required name=search_term_string'],
                    ],
                ];
            }
            return $out;
        }

        // Dynamic pages — resolve entity; fall back to defaults on any failure
        return rescue(function () use ($path, $base, $canonical) {
            if (Str::startsWith($path, 'courses/')) {
                $c = Course::where('slug', Str::after($path, 'courses/'))->first();
                if (!$c) return [];
                $desc = Str::limit(strip_tags($c->subtitle ?: $c->short_description ?: self::DEFAULT_DESC), 155);
                $course = ['@context' => 'https://schema.org', '@type' => 'Course', 'name' => $c->name, 'description' => $desc,
                    'provider' => self::org($base), 'url' => $canonical];
                if ($c->image_url) $course['image'] = $c->image_url;
                $price = $c->sale_price ?: $c->regular_price;
                if ($price > 0) $course['offers'] = ['@type' => 'Offer', 'price' => (string) $price, 'priceCurrency' => 'INR', 'availability' => 'https://schema.org/InStock', 'url' => $canonical];
                return [
                    'title' => $c->name . ' — ' . self::SITE, 'description' => $desc,
                    'image' => $c->image_url ?: null, 'type' => 'product',
                    'jsonld' => [$course, self::crumbs($base, [['Courses', '/courses'], [$c->name, '/courses/' . $c->slug]])],
                ];
            }
            if (Str::startsWith($path, 'tutors/')) {
                $t = Tutor::where('slug', Str::after($path, 'tutors/'))->first();
                if (!$t) return [];
                $desc = Str::limit(strip_tags($t->tagline ?: $t->qualification ?: ''), 155);
                $person = ['@context' => 'https://schema.org', '@type' => 'Person', 'name' => $t->name, 'jobTitle' => 'Tutor',
                    'description' => $desc, 'worksFor' => self::org($base), 'url' => $canonical];
                if ($t->image_url) $person['image'] = $t->image_url;
                if ($t->subjects_list) $person['knowsAbout'] = $t->subjects_list;
                return [
                    'title' => $t->name . ($t->tagline ? ' — ' . $t->tagline : '') . ' | ' . self::SITE,
                    'description' => $desc, 'image' => $t->image_url ?: null, 'type' => 'profile',
                    'jsonld' => [$person, self::crumbs($base, [['Find Tutors', '/find-tutors'], [$t->name, '/tutors/' . $t->slug]])],
                ];
            }
            if (Str::startsWith($path, 'tutors-in/')) {
                $slug = Str::after($path, 'tutors-in/');
                $city = Tutor::published()->get(['city'])->pluck('city')->first(fn ($c) => Str::slug((string) $c) === $slug);
                if (!$city) return [];
                return [
                    'title' => "Online & Home Tutors in {$city} — " . self::SITE,
                    'description' => "Verified tutors for live 1-on-1 and home tuition in {$city}. Browse by subject and book a free trial class.",
                    'jsonld' => [
                        ['@context' => 'https://schema.org', '@type' => 'EducationalOrganization', 'name' => self::SITE . " — Tutors in {$city}",
                         'url' => $canonical, 'areaServed' => ['@type' => 'City', 'name' => $city]],
                        self::crumbs($base, [['Find Tutors', '/find-tutors'], ["Tutors in {$city}", '/tutors-in/' . $slug]]),
                    ],
                ];
            }
            return [];
        }, [], report: false);
    }
}
