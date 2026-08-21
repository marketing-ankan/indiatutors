<?php
namespace App\Support;

use Illuminate\Support\Facades\DB;

/**
 * Product codes.
 *
 * An order number identifies a TRANSACTION; a SKU identifies the THING being
 * sold. The site had neither for most of its catalogue — five of 110 courses
 * carried a hand-typed code and nothing else did — so an order line, a support
 * ticket, an invoice and a spreadsheet export each named a product by its title
 * and had no way to agree they meant the same one.
 *
 * FORMAT: ITO-<TYPE>-<NNNN>, e.g. ITO-C-0042.
 *
 *   C  live course        V  recorded (video) course        P  plan
 *
 * Sequential rather than derived from the name, and that is the whole point. A
 * code built from the title stops being stable the moment somebody edits the
 * title — which is exactly when you most need to know it is still the same
 * product. Assigned once, never reused, never recomputed.
 *
 * The counter is a locked row, the same mechanism DocumentNumber uses for
 * invoice numbers, because two products created in the same instant must not
 * be handed the same code. Deliberately NOT sharing that class: its series are
 * per financial year, which is right for a tax document and wrong for a
 * catalogue that outlives one.
 *
 * LEGACY CODES ARE LEFT ALONE. The five existing ones ("ito-python",
 * "ito-chess"…) are already searchable in the console and may be written down
 * somewhere this repo cannot see. A product's code changing under it is the one
 * thing a product code must never do, so they keep theirs and the generator
 * fills in around them.
 */
class Sku
{
    public const COURSE = 'C';
    public const VIDEO  = 'V';
    public const PLAN   = 'P';

    /**
     * Take the next code in a series.
     *
     * Call inside the transaction that writes it to the row, so a failed save
     * gives the number back instead of leaving a gap. A gap here is cosmetic
     * rather than a problem — unlike an invoice series — but there is no reason
     * to make them.
     */
    public static function next(string $type): string
    {
        $key = 'sku:' . strtolower($type);

        return DB::transaction(function () use ($key, $type) {
            $row = DB::table('number_sequences')->where('key', $key)->lockForUpdate()->first();

            if (! $row) {
                try {
                    DB::table('number_sequences')->insert([
                        'key' => $key, 'next' => 1, 'created_at' => now(), 'updated_at' => now(),
                    ]);
                    $value = 1;
                } catch (\Illuminate\Database\QueryException $e) {
                    // Lost the insert race; the winner's row is now readable.
                    $row   = DB::table('number_sequences')->where('key', $key)->lockForUpdate()->first();
                    $value = (int) $row->next;
                }
            } else {
                $value = (int) $row->next;
            }

            DB::table('number_sequences')->where('key', $key)
                ->update(['next' => $value + 1, 'updated_at' => now()]);

            return sprintf('ITO-%s-%04d', strtoupper($type), $value);
        });
    }

    /** Does this look like a code this class issued? Legacy codes will not. */
    public static function isGenerated(?string $sku): bool
    {
        return (bool) preg_match('/^ITO-[CVP]-\d{4,}$/', (string) $sku);
    }
}
