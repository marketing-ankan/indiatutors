<?php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

/**
 * Gate for /api/matching/v1/* — the machine-to-machine export the external
 * teacher-assignment app reads.
 *
 * A static shared key rather than OAuth because the caller is one server we
 * control, not a fleet of third parties; and a bearer Sanctum token would tie
 * the export to a user account that could be deleted out from under it.
 *
 * With no key configured the export refuses to answer at all. The data behind
 * it is every teacher's home address and every child's home address — an
 * accidentally-open default here is the worst bug this codebase could ship.
 */
class EnsureMatchingClient
{
    public function handle(Request $request, Closure $next)
    {
        $expected = (string) config('services.matching.key');

        if ($expected === '') {
            abort(503, 'The matching export is not configured on this server (MATCHING_API_KEY is unset).');
        }

        $given = (string) ($request->header('X-Matching-Key') ?: $request->bearerToken() ?: '');

        // hash_equals, not ===: string comparison short-circuits on the first
        // differing byte and leaks the key one character at a time.
        abort_unless($given !== '' && hash_equals($expected, $given), 401, 'Invalid or missing matching key.');

        return $next($request);
    }
}
