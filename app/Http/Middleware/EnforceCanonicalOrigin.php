<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * One canonical origin: https:// on the bare domain.
 *
 * 301s http→https and www→apex in a single hop, both derived from APP_URL —
 * nothing here names a host, so the domain can move again by editing one env
 * value (which is exactly how the temp→real cutover was done).
 *
 * WHY THIS LIVES IN PHP AND NOT .htaccess. The natural place for these rules
 * is the docroot .htaccess, and that is where they were first attempted — but
 * on this Hostinger plan .htaccess rewrite rules are provably inert: the stock
 * trailing-slash rule the docroot file already carries does not fire
 * (/courses/ answers 200, not 301). Same finding as on the LMS slot. Rules in
 * a file the server ignores protect nothing, so the redirect lives here, in
 * code that demonstrably runs on every request.
 *
 * WHY THE REDIRECT CANNOT LOOP. The classic failure is an origin that never
 * sees TLS (proxy terminates it), concludes every request is http, and
 * redirects forever. Measured on 2026-08-07 before writing this: over https
 * the session cookie is issued WITH the Secure flag on both the apex (direct,
 * Server: hws) and www (via the hcdn CDN edge), and WITHOUT it over http —
 * i.e. $request->isSecure() reports the truth on every path a request can
 * take to this app. After one hop to https://apex, isSecure() is true, host
 * matches, and this middleware becomes a no-op.
 *
 * The www→apex half also covers the one case scheme detection could miss
 * (an http request to www whose CDN hop upgrades to https): it matches on
 * host alone, and its target is absolute-https regardless.
 *
 * Inert everywhere that matters: on dev APP_URL is http://localhost, the
 * scheme guard fails, and nothing redirects. A request for a host that is
 * neither apex nor www (e.g. a stray IP binding) is passed through untouched
 * rather than redirected somewhere it did not ask for.
 */
class EnforceCanonicalOrigin
{
    public function handle(Request $request, Closure $next): Response
    {
        $app = parse_url((string) config('app.url'));

        // Only enforce when the configured origin is itself https — i.e. in
        // production. Local http APP_URLs disable the whole middleware.
        if (($app['scheme'] ?? '') !== 'https') {
            return $next($request);
        }

        $canonical = strtolower($app['host'] ?? '');
        $host      = strtolower($request->getHost());

        if ($canonical === '' || ! in_array($host, [$canonical, 'www.'.$canonical], true)) {
            return $next($request);
        }

        if ($host !== $canonical || ! $request->isSecure()) {
            // 301, not 302: this is the permanent answer, and search engines
            // move their signals only on a permanent redirect.
            return redirect()->to('https://'.$canonical.$request->getRequestUri(), 301);
        }

        return $next($request);
    }
}
