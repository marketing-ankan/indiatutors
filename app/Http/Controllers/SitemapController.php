<?php
namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Course;
use App\Models\Post;
use App\Models\Tutor;
use Illuminate\Support\Str;

class SitemapController extends Controller {
    public function index() {
        $base = rtrim(config('app.url'), '/');
        $urls = [];

        $add = function (string $loc, ?string $lastmod = null, string $freq = 'weekly', string $priority = '0.6') use (&$urls) {
            $urls[] = compact('loc', 'lastmod', 'freq', 'priority');
        };

        // Static pages
        $add($base . '/', null, 'daily', '1.0');
        foreach (['courses' => '0.9', 'find-tutors' => '0.9', 'plans' => '0.7', 'about' => '0.5',
                  'contact' => '0.4', 'book-demo' => '0.7', 'become-a-teacher' => '0.5',
                  'refer-earn' => '0.4', 'blog' => '0.6',
                  'terms-conditions' => '0.2', 'payment-refund-policy' => '0.2',
                  'refer-earn-policy' => '0.2', 'privacy-policy' => '0.2'] as $p => $pr) {
            $add("$base/$p", null, 'monthly', $pr);
        }

        // Blog posts
        foreach (Post::where('is_published', true)->get(['slug', 'updated_at']) as $post) {
            $add("$base/blog/{$post->slug}", optional($post->updated_at)->toAtomString(), 'monthly', '0.6');
        }

        // Courses
        foreach (Course::where('is_published', true)->get(['slug', 'updated_at']) as $c) {
            $add("$base/courses/{$c->slug}", optional($c->updated_at)->toAtomString(), 'weekly', '0.8');
        }

        // Tutors
        foreach (Tutor::where('is_published', true)->get(['slug', 'updated_at']) as $t) {
            $add("$base/tutors/{$t->slug}", optional($t->updated_at)->toAtomString(), 'weekly', '0.7');
        }

        // City landing pages
        foreach (Tutor::where('is_published', true)->get(['city'])->pluck('city')->filter()->unique() as $city) {
            $add("$base/tutors-in/" . Str::slug($city), null, 'weekly', '0.7');
        }

        // Category browse pages
        foreach (Category::has('courses')->get(['slug']) as $cat) {
            $add("$base/courses?category={$cat->slug}", null, 'weekly', '0.6');
        }

        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
        foreach ($urls as $u) {
            $xml .= "  <url>\n    <loc>" . htmlspecialchars($u['loc'], ENT_XML1) . "</loc>\n";
            if ($u['lastmod']) $xml .= "    <lastmod>{$u['lastmod']}</lastmod>\n";
            $xml .= "    <changefreq>{$u['freq']}</changefreq>\n    <priority>{$u['priority']}</priority>\n  </url>\n";
        }
        $xml .= '</urlset>';

        return response($xml, 200, ['Content-Type' => 'application/xml']);
    }

    public function robots() {
        $base = rtrim(config('app.url'), '/');
        $txt = "User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: {$base}/sitemap.xml\n";
        return response($txt, 200, ['Content-Type' => 'text/plain']);
    }
}
