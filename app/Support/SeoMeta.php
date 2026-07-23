<?php
namespace App\Support;

use App\Models\Category;
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

        $meta = self::resolve($path, $base, $canonical, $request);
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

    private static function resolve(string $path, string $base, string $canonical, Request $request): array {
        // Static pages — titles match the live site's <title> per the parity audit.
        static $statics = null;
        $statics ??= [
            ''                  => ['title' => self::SITE . ' — Live Online Tutoring & Verified Home Tutors Across India'],
            'courses'           => ['title' => 'Shop — ' . self::SITE, 'description' => 'Browse 130+ live and self-paced courses across academics, coding, music, dance, languages and more.'],
            'find-tutors'       => ['title' => 'Find a Verified Tutor — ' . self::SITE, 'description' => 'Browse verified, qualification-checked tutors by subject, city and mode. Book a free trial class.'],
            'physical-classes'  => ['title' => 'Home Tuition — Find a Home Tutor Near You | ' . self::SITE, 'description' => 'Find verified home tutors near you by pincode, subject and class. Book a free home demo with a tutor who teaches in your area.'],
            'plans'             => ['title' => 'Plans & Pricing — ' . self::SITE, 'description' => 'Simple, honest pricing for live tutoring. First class is always free.'],
            'about'             => ['title' => 'About Us — ' . self::SITE, 'description' => "India's trusted platform for live 1-on-1 tutoring and verified home tutors."],
            'contact'           => ['title' => 'Contact — ' . self::SITE, 'description' => 'Get in touch with Indiatutors Online.'],
            'book-demo'         => ['title' => 'Book Demo — ' . self::SITE, 'description' => 'Book a free 30-minute demo class. Meet your tutor. No payment required.'],
            'become-a-teacher'  => ['title' => 'Become a Teacher — ' . self::SITE, 'description' => 'Teach on Indiatutors Online. Apply to become a verified tutor.'],
            'refer-earn'        => ['title' => 'Refer & Earn — ' . self::SITE, 'description' => 'Refer friends to Indiatutors Online and earn rewards.'],
            'login'             => ['title' => 'Login — ' . self::SITE, 'robots' => 'noindex, follow'],
            'dashboard'         => ['title' => 'Dashboard — ' . self::SITE, 'robots' => 'noindex, nofollow'],
            'admin'             => ['title' => 'Staff Console — ' . self::SITE, 'robots' => 'noindex, nofollow'],
            // Live-parity quirk: WP titles the posts index with the site name twice.
            'blog'              => ['title' => self::SITE . ' — ' . self::SITE . ' — Live Online Tutoring & Verified Home Tutors Across India', 'description' => 'Practical advice on tutoring, study skills and helping your child learn.'],
            'privacy'           => ['title' => 'Privacy Policy — ' . self::SITE],
            'terms'             => ['title' => 'Terms of Service — ' . self::SITE],
            'refund'            => ['title' => 'Refund & Cancellation Policy — ' . self::SITE],
            'group-classes'     => ['title' => 'Group Classes — ' . self::SITE, 'description' => 'Expert-led small-group sessions — structured curriculum, peer learning and affordable group pricing.'],
            'free-classes'      => ['title' => 'Free Classes — ' . self::SITE, 'description' => 'Free demo classes and workshops across our most popular subjects.'],
            'video-courses'     => ['title' => 'Video Courses — ' . self::SITE, 'description' => 'Structured, self-paced video courses — learn anytime, revisit lessons and practise at your own speed.'],
            'events-workshops'  => ['title' => 'Events & Workshops — ' . self::SITE, 'description' => 'Short, hands-on live workshops and competitions across our most popular subjects.'],
            'competitive-exams' => ['title' => 'Competitive Exams — ' . self::SITE, 'description' => 'Focused, strategy-led coaching for standardised tests.'],
            'skill-programmes'  => ['title' => 'Skill Programmes — ' . self::SITE, 'description' => 'Career- and future-focused skill tracks for older learners.'],
            'cart'              => ['title' => 'Cart — ' . self::SITE, 'robots' => 'noindex, follow'],
            // Live-parity: an empty /checkout redirects to the cart, so the URL
            // serves "Cart" (the SPA does the same redirect client-side).
            'checkout'          => ['title' => 'Cart — ' . self::SITE, 'robots' => 'noindex, follow'],
            'wishlist'          => ['title' => 'Wishlist — ' . self::SITE, 'robots' => 'noindex, follow'],
            // WordPress/WooCommerce alias URLs served for live-parity; they'll
            // also be 301 targets in the go-live redirect map.
            'faqs'              => ['title' => 'FAQs — ' . self::SITE, 'description' => 'Frequently asked questions about classes, payments, scheduling, certificates and progress tracking.'],
            'download-curriculum' => ['title' => 'Download Curriculum — ' . self::SITE, 'description' => 'Get the complete level-by-level curriculum for any of our courses — free.'],
            'my-account'        => ['title' => 'My account — ' . self::SITE, 'robots' => 'noindex, follow'],
            'refund_returns'    => ['title' => 'Refund and Returns Policy — ' . self::SITE],
            'plans-and-pricing' => ['title' => 'Plans & Pricing — ' . self::SITE, 'description' => 'Simple, honest pricing for live tutoring. First class is always free.'],
        ];

        // Category-filtered course archive (/courses?category=slug) — the live
        // /product-category/{slug}/ equivalent titles the category name.
        if ($path === 'courses' && ($catSlug = $request->query('category'))) {
            $cat = rescue(fn () => Category::where('slug', $catSlug)->first(), null, report: false);
            if ($cat) {
                return [
                    'title'       => $cat->name . ' — ' . self::SITE,
                    'description' => "Live, expert-led {$cat->name} classes with a personalised curriculum. Book a free demo.",
                    'jsonld'      => [self::crumbs($base, [['Courses', '/courses'], [$cat->name, '/courses?category=' . $catSlug]])],
                ];
            }
        }
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
            if (Str::startsWith($path, 'tutors/') || Str::startsWith($path, 'tutor/')) {
                $t = Tutor::where('slug', Str::afterLast($path, '/'))->first();
                if (!$t) return [];
                $desc = Str::limit(strip_tags($t->tagline ?: $t->qualification ?: ''), 155);
                $person = ['@context' => 'https://schema.org', '@type' => 'Person', 'name' => $t->name, 'jobTitle' => 'Tutor',
                    'description' => $desc, 'worksFor' => self::org($base), 'url' => $canonical];
                if ($t->image_url) $person['image'] = $t->image_url;
                if ($t->subjects_list) $person['knowsAbout'] = $t->subjects_list;
                return [
                    'title' => $t->name . ' — ' . self::SITE, // live-parity: "{Name} – Indiatutors Online"
                    'description' => $desc, 'image' => $t->image_url ?: null, 'type' => 'profile',
                    'jsonld' => [$person, self::crumbs($base, [['Find Tutors', '/find-tutors'], [$t->name, '/tutor/' . $t->slug]])],
                ];
            }
            if (Str::startsWith($path, 'video-courses/')) {
                $vc = \App\Models\VideoCourse::published()->where('slug', Str::after($path, 'video-courses/'))->first();
                if (!$vc) return [];
                $desc = Str::limit(strip_tags($vc->subtitle ?: $vc->description ?: ''), 155);
                return [
                    'title'       => $vc->title . ' — Self-Paced Video Course | ' . self::SITE,
                    'description' => $desc,
                    'type'        => 'product',
                    'jsonld'      => [self::crumbs($base, [['Video Courses', '/video-courses'], [$vc->title, $path]])],
                ];
            }
            if (Str::startsWith($path, 'board/')) {
                static $boards = [
                    'cbse' => ['CBSE', 'Central Board of Secondary Education'],
                    'icse' => ['ICSE / ISC', 'Indian Certificate of Secondary Education'],
                    'igcse' => ['IGCSE / Cambridge', 'Cambridge international curriculum'],
                    'state-boards' => ['State Boards', 'State-level secondary boards'],
                    'ncert' => ['NCERT', 'the national NCERT curriculum'],
                ];
                $b = $boards[Str::after($path, 'board/')] ?? null;
                if (!$b) return [];
                return [
                    'title'       => $b[0] . ' Tuition — Online 1-on-1 Classes | ' . self::SITE,
                    'description' => "Live online {$b[0]} tuition taught to {$b[1]}'s syllabus and exam pattern. Book a free demo with a verified tutor.",
                    'jsonld'      => [self::crumbs($base, [['Courses', '/courses'], [$b[0], $path]])],
                ];
            }
            if (Str::startsWith($path, 'events/')) {
                $ev = \App\Models\Event::published()->where('slug', Str::after($path, 'events/'))->first();
                if (!$ev) return [];
                $desc = Str::limit(strip_tags($ev->description ?: ''), 155);
                $jsonld = ['@context' => 'https://schema.org', '@type' => 'Event', 'name' => $ev->title,
                    'description' => $desc, 'eventAttendanceMode' => 'https://schema.org/OnlineEventAttendanceMode',
                    'organizer' => self::org($base), 'url' => $canonical];
                if ($ev->starts_at) $jsonld['startDate'] = $ev->starts_at->toIso8601String();
                if ($ev->ends_at)   $jsonld['endDate'] = $ev->ends_at->toIso8601String();
                return [
                    'title'       => $ev->title . ' — ' . self::SITE,
                    'description' => $desc,
                    'jsonld'      => [$jsonld, self::crumbs($base, [['Events & Workshops', '/events-workshops'], [$ev->title, '/events/' . $ev->slug]])],
                ];
            }
            if (Str::startsWith($path, 'subject/')) {
                // Live /subject/{slug}/ tutor archive — resolve the display name
                // from the tutors' own subject strings (keeps "Violin / Viola").
                $slug = Str::after($path, 'subject/');
                // Live taxonomy names that de-slugify lossily.
                $special = ['violin-viola' => 'Violin / Viola'];
                $name = $special[$slug]
                    ?? Tutor::published()->get(['subjects'])
                        ->flatMap(fn ($t) => $t->subjects_list ?? [])
                        ->unique()
                        ->first(fn ($s) => Str::slug($s) === $slug)
                    ?? Str::headline(str_replace('-', ' ', $slug));
                return [
                    'title'       => $name . ' — ' . self::SITE,
                    'description' => "Verified {$name} tutors for live 1-on-1 classes. Browse profiles and book a free trial class.",
                    'jsonld'      => [self::crumbs($base, [['Find Tutors', '/find-tutors'], [$name, '/subject/' . $slug]])],
                ];
            }
            if (Str::startsWith($path, 'blog/')) {
                $p = \App\Models\Post::where('slug', Str::after($path, 'blog/'))->first();
                if (!$p) return [];
                $desc = Str::limit(strip_tags($p->excerpt ?: $p->body), 155);
                $article = ['@context' => 'https://schema.org', '@type' => 'Article', 'headline' => $p->title,
                    'description' => $desc, 'author' => ['@type' => 'Organization', 'name' => self::SITE],
                    'publisher' => self::org($base), 'url' => $canonical,
                    'datePublished' => optional($p->published_at)->toIso8601String()];
                if ($p->image_url) $article['image'] = $p->image_url;
                return [
                    'title' => $p->title . ' — ' . self::SITE, 'description' => $desc,
                    'image' => $p->image_url ?: null, 'type' => 'article',
                    'jsonld' => [$article, self::crumbs($base, [['Blog', '/blog'], [$p->title, '/blog/' . $p->slug]])],
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
