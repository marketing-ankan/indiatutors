<?php
namespace App\Support;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Serial numbers for orders and tax invoices.
 *
 * The obvious implementation — MAX(number) + 1 — is wrong under the only
 * conditions that matter. Two checkouts landing in the same instant both read
 * the same maximum and both mint the same number, and because that needs
 * concurrency to happen at all, it will not show up in testing and will show up
 * on the day trade is good. The counter therefore lives in its own row and is
 * read under a lock inside a transaction.
 *
 * FORMAT: PREFIX-FYFY-NNNNNN, e.g. ORD-2627-000042, INV-2627-000042.
 *
 * Fifteen characters, which keeps an invoice number inside the sixteen-character
 * limit Indian GST rules place on one, using only characters those rules allow
 * (letters, digits and a hyphen). The financial-year segment is there because
 * the invoice series is required to be unique within a financial year rather
 * than for all time, and because "which year is this from" should be readable
 * off the document without looking anything up.
 *
 * Indian financial years run April to March, so an order placed in January 2027
 * belongs to 2026-27 and reads 2627.
 */
class DocumentNumber
{
    public const ORDER   = 'ORD';
    public const INVOICE = 'INV';

    /**
     * Take the next number in a series.
     *
     * MUST be called inside a transaction that also writes the number to the
     * row it belongs to. Allocating in one transaction and saving in another
     * leaves a hole in the series if the save fails — and a hole in an invoice
     * series is the thing that has to be explained to somebody later.
     */
    public static function next(string $prefix, ?Carbon $on = null): string
    {
        $fy  = self::financialYear($on);
        $key = strtolower($prefix) . ':' . $fy;

        return DB::transaction(function () use ($key, $prefix, $fy) {
            // lockForUpdate is a no-op on SQLite, which is fine: SQLite
            // serialises writers anyway, so the read-modify-write below cannot
            // interleave there either. On MySQL it is doing the real work.
            $row = DB::table('number_sequences')->where('key', $key)->lockForUpdate()->first();

            if (! $row) {
                // Racing inserts are settled by the primary key: whoever loses
                // gets a duplicate-key error, and re-reading finds the winner's
                // row. Cheaper and more reliable than a table-level lock.
                try {
                    DB::table('number_sequences')->insert([
                        'key' => $key, 'next' => 1, 'created_at' => now(), 'updated_at' => now(),
                    ]);
                    $value = 1;
                } catch (\Illuminate\Database\QueryException $e) {
                    $row = DB::table('number_sequences')->where('key', $key)->lockForUpdate()->first();

                    // A duplicate key is the expected reason to land here, and
                    // the re-read finds the winner's row. It is NOT the only
                    // reason: a deadlock, a lock-wait timeout or a busy
                    // database throws the same exception type, and then the
                    // re-read finds nothing and `$row->next` fataled on null —
                    // turning a retryable database hiccup into a 500 in the
                    // middle of taking money. Rethrow what we did not expect.
                    if (! $row) throw $e;

                    $value = (int) $row->next;
                }
            } else {
                $value = (int) $row->next;
            }

            DB::table('number_sequences')->where('key', $key)
                ->update(['next' => $value + 1, 'updated_at' => now()]);

            return sprintf('%s-%s-%06d', $prefix, $fy, $value);
        });
    }

    /** "2627" for any date in the Indian financial year 2026-27 (Apr–Mar). */
    public static function financialYear(?Carbon $on = null): string
    {
        $d     = ($on ?: now())->copy()->timezone(config('app.timezone', 'Asia/Kolkata'));
        $start = $d->month >= 4 ? $d->year : $d->year - 1;

        return substr((string) $start, 2, 2) . substr((string) ($start + 1), 2, 2);
    }
}
