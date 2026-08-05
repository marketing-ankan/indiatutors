<?php
namespace App\Http\Middleware;

use App\Support\SchemaHealer;
use Closure;
use Illuminate\Http\Request;

/**
 * Guards the support routes.
 *
 * Without this, a deploy whose `migrate` step died would leave every parent's
 * dashboard calling /api/support/tickets against a table that does not exist —
 * and the Help & support card would quietly show "nothing open" to someone
 * trying to report a problem, which is the same silence this feature was built
 * to end.
 */
class EnsureSupportSchema
{
    public function handle(Request $request, Closure $next)
    {
        SchemaHealer::ensure(['support_tickets', 'support_messages'], 'support', 'Support');

        return $next($request);
    }
}
