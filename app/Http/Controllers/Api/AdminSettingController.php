<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Setting;
use App\Support\SiteSettings;
use Illuminate\Http\Request;

// Settings staff can change without a deploy. Whitelisted on purpose: the table
// is a key/value store shared with SeedFingerprint's hashes, and an endpoint
// that writes arbitrary keys is an endpoint that can quietly set anything the
// app ever reads from it.
class AdminSettingController extends Controller
{
    public function index()
    {
        return response()->json([
            'data' => SiteSettings::all(),
            // The console shows what each field falls back to when cleared, so
            // "blank" never looks like "broken".
            'defaults' => collect(SiteSettings::FIELDS)->map(fn ($f) => $f[0]),
            'labels'   => collect(SiteSettings::FIELDS)->map(fn ($f) => $f[2]),
        ]);
    }

    public function update(Request $request)
    {
        $data = $request->validate(SiteSettings::rules());

        foreach ($data as $key => $value) {
            if (array_key_exists($key, SiteSettings::FIELDS)) {
                // Store '' rather than null for a cleared field. Laravel's
                // ConvertEmptyStringsToNull turns a blank input into null, which
                // is indistinguishable from "never set" — so clearing a social
                // link would silently restore the shipped default instead of
                // hiding the icon, which is what the console offers to do.
                Setting::put($key, $value ?? '');
            }
        }

        AuditLog::record('setting_updated', 'setting', null, implode(', ', array_keys($data)));

        return $this->index();
    }
}
