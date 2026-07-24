<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

// Social feeds for the course page — both cached so they self-refresh:
//
//  /api/social/youtube   → the channel's TOP-VIEWED videos (no API key: the
//    public /videos page is fetched and its lockupViewModel data parsed,
//    then sorted by view count). Cached 12h, so when a video's views grow
//    the ranking updates automatically. On any fetch/parse failure a baked
//    fallback list is served — the section never breaks.
//
//  /api/social/instagram → latest posts via the Instagram Graph API, only
//    when INSTAGRAM_ACCESS_TOKEN is configured (anonymous scraping is
//    blocked by Instagram). Cached 1h; new posts appear on the site
//    automatically after the cache rolls. Without a token → configured:false
//    and the frontend keeps its branded placeholder tiles.
class SocialFeedController extends Controller {
    private const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

    /** Baked fallback (top-viewed as of 2026-07-24) if the live fetch fails. */
    private const YT_FALLBACK = [
        ['id' => '9_ECn8SAuSo', 'title' => 'DIY Princess Crown — Easy Paper Crown for Kids', 'len' => '1:22'],
        ['id' => 'G_9RIBCM80E', 'title' => 'How to Draw a Lion — Easy Step-by-Step for Kids', 'len' => '10:46'],
        ['id' => 'gUYjrjEjyzA', 'title' => 'Mermaid Watercolour Painting for Beginners', 'len' => '16:46'],
        ['id' => '4yjo8nrmlGc', 'title' => 'Mandala in the Clouds — Step by Step', 'len' => '15:02'],
        ['id' => 'BLKRdEgJGOg', 'title' => 'Paper Folding Carrot & Bunny', 'len' => '6:59'],
        ['id' => 'cSFfJLWctI4', 'title' => 'Splash Art Landscape Painting for Beginners', 'len' => '16:25'],
    ];

    public function youtube() {
        $videos = Cache::remember('social:youtube-top', now()->addHours(12), function () {
            try {
                $html = Http::withHeaders(['User-Agent' => self::UA, 'Accept-Language' => 'en'])
                    ->timeout(10)->get(config('services.youtube.channel_url'))->body();
                $parsed = $this->parseChannel($html);
                return count($parsed) >= 3 ? array_slice($parsed, 0, 6) : self::YT_FALLBACK;
            } catch (\Throwable $e) {
                return self::YT_FALLBACK;
            }
        });
        return response()->json(['data' => $videos]);
    }

    /** Parse the channel /videos page: one lockupViewModel block per video. */
    private function parseChannel(string $html): array {
        $chunks = explode('"lockupViewModel":{', $html);
        $out = [];
        $seen = [];
        for ($i = 1, $n = count($chunks); $i < $n; $i++) {
            $c = substr($chunks[$i], 0, 9000);
            if (!preg_match('#/vi/([\w-]{11})/#', $c, $m)) continue;
            $id = $m[1];
            if (isset($seen[$id])) continue;
            $seen[$id] = true;
            $title = preg_match('/"lockupMetadataViewModel":\{"title":\{"content":"((?:[^"\\\\]|\\\\.)*)"/', $c, $m)
                ? (json_decode('"' . $m[1] . '"') ?? $m[1]) : '';
            $len = preg_match('/"thumbnailBadgeViewModel":\{"text":"([\d:]+)"/', $c, $m) ? $m[1] : '';
            $views = preg_match('/"metadataParts":\[\{"text":\{"content":"([\d.,]+[KMB]?) views?"/', $c, $m) ? $m[1] : '0';
            $out[] = ['id' => $id, 'title' => $title, 'len' => $len, 'views' => $this->viewsToInt($views)];
        }
        usort($out, fn ($a, $b) => $b['views'] <=> $a['views']);
        // views are internal ranking data — don't expose tiny counts publicly
        return array_map(fn ($v) => ['id' => $v['id'], 'title' => $v['title'], 'len' => $v['len']], $out);
    }

    private function viewsToInt(string $v): int {
        $v = str_replace(',', '', trim($v));
        $mult = 1;
        foreach (['K' => 1e3, 'M' => 1e6, 'B' => 1e9] as $suffix => $x) {
            if (str_ends_with($v, $suffix)) { $mult = $x; $v = substr($v, 0, -1); break; }
        }
        return (int) round(((float) $v) * $mult);
    }

    public function instagram() {
        $token = config('services.instagram.token');
        if (!$token) return response()->json(['configured' => false, 'data' => []]);

        $posts = Cache::remember('social:instagram-latest', now()->addHour(), function () use ($token) {
            try {
                $resp = Http::timeout(10)->get('https://graph.instagram.com/me/media', [
                    'fields' => 'id,caption,media_type,media_url,thumbnail_url,permalink',
                    'limit' => 8,
                    'access_token' => $token,
                ])->json();
                return collect($resp['data'] ?? [])
                    ->filter(fn ($p) => in_array($p['media_type'] ?? '', ['IMAGE', 'CAROUSEL_ALBUM', 'VIDEO']))
                    ->map(fn ($p) => [
                        'id' => $p['id'],
                        'image' => $p['media_type'] === 'VIDEO' ? ($p['thumbnail_url'] ?? null) : ($p['media_url'] ?? null),
                        'permalink' => $p['permalink'] ?? null,
                        'caption' => mb_substr($p['caption'] ?? '', 0, 120),
                    ])
                    ->filter(fn ($p) => $p['image'] && $p['permalink'])
                    ->values()->all();
            } catch (\Throwable $e) {
                return [];
            }
        });
        return response()->json(['configured' => true, 'data' => $posts]);
    }
}
