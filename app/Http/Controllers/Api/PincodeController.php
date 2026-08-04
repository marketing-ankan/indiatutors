<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\PincodeDirectory;
use Illuminate\Http\Request;

/**
 * Address autofill for the physical-tuition forms.
 *
 * Public and unauthenticated on purpose: the "Become a Teacher" form and the
 * "find me a home tutor" form both run before anyone has an account, and a
 * pincode is not private information. Throttled at the route.
 */
class PincodeController extends Controller
{
    public function show(string $pincode)
    {
        $result = PincodeDirectory::lookup($pincode);

        // 200 with found:false rather than 404 — the caller is a form typing
        // ahead of the user, and a 404 in the console on every 4th keystroke
        // makes real errors invisible.
        if (!$result) {
            return response()->json([
                'found'   => false,
                'message' => "We couldn't find that pincode — you can type the district and state yourself.",
            ]);
        }

        return response()->json(['found' => true] + $result);
    }

    /** Suggest pincodes as the user types a locality or a partial pincode. */
    public function search(Request $request)
    {
        $q = trim((string) $request->query('q', ''));
        if (strlen($q) < 3) return response()->json(['data' => []]);

        $rows = \App\Models\Pincode::query()
            ->when(ctype_digit($q),
                fn ($b) => $b->where('pincode', 'like', "$q%"),
                fn ($b) => $b->where('district', 'like', "%$q%")->orWhere('localities', 'like', "%$q%"))
            ->orderBy('pincode')->limit(15)
            ->get(['pincode', 'district', 'state', 'localities']);

        return response()->json(['data' => $rows]);
    }
}
