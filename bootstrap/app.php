<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // TLS terminates in front of PHP on this host (hws for the apex, the
        // hcdn CDN for www). Trusting the forwarded headers lets isSecure()
        // reflect the CLIENT's scheme rather than the last hop's, which the
        // canonical-origin redirect below depends on. at: '*' because the
        // proxy's address is the host's business, and nothing reaches PHP
        // here except through it.
        $middleware->trustProxies(at: '*');

        // http→https and www→apex, one hop. append(), NOT prepend(): prepend
        // puts this AHEAD of TrustProxies in the global stack, where
        // isSecure() reads the raw last-hop scheme instead of the client's —
        // measured locally as a 301 issued to a request whose
        // X-Forwarded-Proto said https, which is precisely the shape of a
        // redirect loop if a proxy hop ever terminates TLS for us. Appended,
        // it still runs before every route (and thus before any session
        // cookie), but on the proxy-normalised request. See the class for why
        // this is PHP and not .htaccess (.htaccess is provably inert here).
        $middleware->append(\App\Http\Middleware\EnforceCanonicalOrigin::class);

        $middleware->statefulApi();
        // The API is stateless (bearer tokens) — never redirect an unauthenticated
        // API request to a (non-existent) `login` page; that throws and 500s.
        $middleware->redirectGuestsTo(
            fn (Request $request) => $request->is('api/*') ? null : route('login')
        );
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // API requests always get JSON errors — e.g. a clean 401 for an
        // unauthenticated call — even when the client didn't send Accept: application/json.
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request, Throwable $e) => $request->is('api/*') || $request->expectsJson()
        );
    })->create();
