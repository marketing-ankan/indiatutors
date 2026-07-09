<?php
namespace App\Support;

use App\Models\Course;
use App\Models\Tutor;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SeoMeta {
    private const SITE = 'Indiatutors Online';
    private const DEFAULT_DESC = 'Live 1-on-1 classes, group sessions, and self-paced video courses across Academics, Coding, Music, Dance, Languages & more — taught by verified tutors.';

    /** Build the meta bag for the current request path. */
    public static function for(Request $request): array {
        $base = rtrim(config('app.url'), '/');
        $path = trim($request->path(), '/');
        $path = $path === '' ? '' : $path;
        $canonical = $base . ($path === '' ? '/' : '/' . $path);

        $meta = self::resolve($path);
        return array_merge([
            'title'       => self::SITE . ' — Live Online Tutoring & Verified Home Tutors Across India',
            'description' => self::DEFAULT_DESC,
            'canonical'   => $canonical,
            'image'       => null,
            'type'        => 'website',
            'robots'      => 'index, follow',
            'site_name'   => self::SITE,
        ], $meta, ['canonical' => $canonical]);
    }

    private static function resolve(string $path): array {
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
            'privacy'          => ['title' => 'Privacy Policy — ' . self::SITE],
            'terms'            => ['title' => 'Terms of Service — ' . self::SITE],
            'refund'           => ['title' => 'Refund & Cancellation Policy — ' . self::SITE],
        ];
        if (array_key_exists($path, $statics)) return $statics[$path];

        // Dynamic pages — resolve the entity, fall back to defaults on any failure
        return rescue(function () use ($path) {
            if (Str::startsWith($path, 'courses/')) {
                $c = Course::where('slug', Str::after($path, 'courses/'))->first();
                if (!$c) return [];
                return [
                    'title'       => $c->name . ' — ' . self::SITE,
                    'description' => Str::limit(strip_tags($c->subtitle ?: $c->short_description ?: self::DEFAULT_DESC), 155),
                    'image'       => $c->image_url ?: null,
                    'type'        => 'product',
                ];
            }
            if (Str::startsWith($path, 'tutors/')) {
                $t = Tutor::where('slug', Str::after($path, 'tutors/'))->first();
                if (!$t) return [];
                return [
                    'title'       => $t->name . ($t->tagline ? ' — ' . $t->tagline : '') . ' | ' . self::SITE,
                    'description' => Str::limit(strip_tags($t->tagline ?: $t->qualification ?: ''), 155),
                    'image'       => $t->image_url ?: null,
                    'type'        => 'profile',
                ];
            }
            if (Str::startsWith($path, 'tutors-in/')) {
                $slug = Str::after($path, 'tutors-in/');
                $city = Tutor::published()->get(['city'])->pluck('city')->first(fn ($c) => Str::slug((string) $c) === $slug);
                if (!$city) return [];
                return [
                    'title'       => "Online & Home Tutors in {$city} — " . self::SITE,
                    'description' => "Verified tutors for live 1-on-1 and home tuition in {$city}. Browse by subject and book a free trial class.",
                ];
            }
            return [];
        }, [], report: false);
    }
}
