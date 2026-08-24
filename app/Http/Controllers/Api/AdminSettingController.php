<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Setting;
use App\Support\SiteSettings;
use App\Support\TaxSettings;
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
            // Site fields and tax fields merged into one payload, because the
            // form posts them back as one object. A field the form writes but
            // this does not return reads back as undefined and is wiped by the
            // next save — the round trip has to be closed at both ends.
            'data' => SiteSettings::all() + TaxSettings::all(),
            // The console shows what each field falls back to when cleared, so
            // "blank" never looks like "broken".
            'defaults' => collect(SiteSettings::FIELDS + TaxSettings::FIELDS)->map(fn ($f) => $f[0]),
            'labels'   => collect(SiteSettings::FIELDS + TaxSettings::FIELDS)->map(fn ($f) => $f[2]),
            'backups'  => $this->backupStatus(),
        ]);
    }

    /**
     * Whether the deploy's database backup is actually working.
     *
     * The deploy dumps the database before migrating, but it reports that only
     * into storage/logs/deploy.log — which is not web-readable (correctly), so
     * on a host with no practical shell access the owner had no way to tell a
     * working backup from one silently failing on a missing mysqldump. A backup
     * nobody can verify is barely a backup.
     *
     * Metadata only: count, age and size. Deliberately NO download link — a SQL
     * dump is every customer's name, email and phone, and putting it behind a
     * URL is how that ends up somewhere it should not be.
     */
    private function backupStatus(): array
    {
        $dir = storage_path('app/backups');
        // fn, not the bare 'is_file' string: Collection::filter passes (value,
        // key), and is_file() takes exactly one argument — so the string form
        // threw ArgumentCountError and 500'd this whole tab, but only once a
        // backup actually existed.
        $files = is_dir($dir)
            ? collect(glob($dir . '/db-*.sql*'))->filter(fn ($f) => is_file($f))
                ->sortByDesc(fn ($f) => filemtime($f))->values()
            : collect();

        $newest = $files->first();

        return [
            'count'       => $files->count(),
            'newest_at'   => $newest ? date('c', filemtime($newest)) : null,
            'newest_size' => $newest ? filesize($newest) : null,
            'newest_name' => $newest ? basename($newest) : null,
        ];
    }

    public function update(Request $request)
    {
        // Tax configuration is edited on the same screen and saved by the same
        // request. Kept as a separate FIELDS map because these are not display
        // details — gst_enabled and the rate decide what a legal document says,
        // and SiteSettings::all() is published to every visitor.
        $data = $request->validate(SiteSettings::rules() + TaxSettings::rules());

        foreach ($data as $key => $value) {
            if (array_key_exists($key, SiteSettings::FIELDS)
                || array_key_exists($key, TaxSettings::FIELDS)) {
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
