<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Setting;
use Illuminate\Http\Request;

// Settings staff can change without a deploy. Whitelisted on purpose: the table
// is a key/value store, and an endpoint that writes arbitrary keys is an
// endpoint that can quietly set anything the app ever reads from it.
class AdminSettingController extends Controller
{
    private const KEYS = ['google_review_url'];

    public function index()
    {
        return response()->json(['data' => collect(self::KEYS)
            ->mapWithKeys(fn ($k) => [$k => Setting::get($k)])]);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'google_review_url' => 'nullable|url|max:500',
        ]);

        foreach ($data as $key => $value) {
            if (in_array($key, self::KEYS, true)) Setting::put($key, $value);
        }
        AuditLog::record('setting_updated', 'setting', null, implode(', ', array_keys($data)));

        return $this->index();
    }
}
