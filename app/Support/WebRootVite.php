<?php
namespace App\Support;

use Illuminate\Foundation\Vite;

/**
 * Renders the asset tags from the manifest the WEB SERVER is actually serving,
 * rather than the one sitting in the repository checkout.
 *
 * THE PROBLEM. On this Hostinger plan only `public_html` may serve files, so the
 * app lives in `public_html/laravel` and a COPY of the built assets is kept at
 * `public_html/build`. Two directories, refreshed at different moments:
 *
 *   git pull  ->  laravel/public/build/manifest.json     (what @vite reads)
 *   copy step ->  public_html/build/*                    (what browsers fetch)
 *
 * The pull is instant and the copy is a separate step that can be killed, fail,
 * or simply lag. In the gap the app renders `<script src=main-<newhash>.js>`
 * while the web root still holds the previous build, the bundle 404s, and the
 * page paints nothing. Measured: 3.5, 4.9 and ~4 minutes across three deploys in
 * July, 5½ minutes on 5 August, and ~5 minutes again on 10 August (19:40:29 to
 * 19:45:25) — a window every single frontend deploy pays for.
 *
 * Every previous attempt made the COPY more reliable: order it first, put it in
 * a file that provably runs, self-heal from the shell request (see
 * [[DocrootBuild]]). Each narrows the window; none can close it, because two
 * directories updated by two mechanisms can always disagree.
 *
 * THE FIX. Stop having an opinion about which bundle is current and read it from
 * the directory that answers the request. Then the HTML cannot name a file the
 * web root lacks: whatever manifest is there names assets that are there beside
 * it — both copiers write the manifest last (DocrootBuild::sync) or swap the
 * whole directory atomically (run.sh), so a manifest is never visible before the
 * files it points at.
 *
 * The failure mode inverts, which is the entire point. Before, a late copy meant
 * a BLANK SITE until cron noticed. Now it means the site keeps serving the
 * previous build — correct, just not yet updated — and picks up the new one the
 * moment the copy lands. An outage becomes a delay.
 *
 * SCOPE. Only the manifest LOOKUP changes. Asset URLs still come from
 * asset('build/...'), which was always right; it is only the question "which
 * hashed filename?" that was being answered from the wrong place.
 */
final class WebRootVite extends Vite
{
    /**
     * Resolved manifest path per build directory, for this request only.
     *
     * manifestPath() is called several times while rendering the tags (once per
     * entry point, plus preloads), and validating the candidate reads the file.
     * PHP discards statics between requests, so this cannot go stale across a
     * deploy — it only avoids re-reading the same ~1 KB inside one render.
     *
     * @var array<string, string|null>
     */
    private static array $resolved = [];

    /**
     * @param  string  $buildDirectory
     * @return string
     */
    protected function manifestPath($buildDirectory)
    {
        $default = parent::manifestPath($buildDirectory);
        $key     = $buildDirectory . '|' . $this->manifestFilename;

        if (!array_key_exists($key, self::$resolved)) {
            self::$resolved[$key] = $this->webRootManifest($buildDirectory);
        }

        return self::$resolved[$key] ?? $default;
    }

    /**
     * The web root's manifest, or null to leave the framework's behaviour alone.
     *
     * Null on any doubt whatsoever. This runs on the path that renders every
     * page, so the standard layout (local dev, any normal deploy) must reach the
     * parent implementation untouched, and a web root that is missing or
     * half-written must fall back rather than take the site down.
     */
    private function webRootManifest(string $buildDirectory): ?string
    {
        try {
            $webRoot = DocrootBuild::webRoot();
            if ($webRoot === null) {
                return null;
            }

            $candidate = $webRoot . '/' . $buildDirectory . '/' . $this->manifestFilename;

            // Readable, non-empty, decodable, and shaped like a manifest. A torn
            // file should not be possible — both copiers rename into place — but
            // the cost of checking is one small read, and the cost of being
            // wrong is a ViteManifestNotFoundException on every page.
            if (!is_file($candidate) || @filesize($candidate) < 1) {
                return null;
            }

            $json = json_decode((string) @file_get_contents($candidate), true);

            return is_array($json) && $json !== [] ? $candidate : null;
        } catch (\Throwable) {
            return null;
        }
    }
}
