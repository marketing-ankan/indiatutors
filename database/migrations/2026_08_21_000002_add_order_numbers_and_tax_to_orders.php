<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Give an order a name of its own, and somewhere to record the tax on it.
 *
 * Orders were identified by their primary key and shown to customers as "#123".
 * That is a poor public identifier for two reasons: it tells anyone who buys
 * exactly how many orders the business has ever taken, and it cannot survive
 * anything that renumbers rows. It is also useless on a tax invoice, where the
 * number has to be a serial that is unique within a financial year.
 *
 * TWO numbers, not one, and this is the part worth being deliberate about:
 *
 *   order_number    minted when the order is placed. Every order gets one,
 *                   including the ones that are never paid.
 *   invoice_number  minted when the order is PAID, and never before.
 *
 * They are separate because an abandoned or cancelled order must not consume an
 * invoice number. A tax invoice series is expected to be continuous, and gaps
 * in it are exactly the thing that has to be explained later. Tying the invoice
 * number to payment keeps the series honest without any cleanup job.
 *
 * The tax columns are a SNAPSHOT, written once when the invoice is issued and
 * never recomputed. Rates change, the business's registration status changes,
 * and a document that silently re-renders under today's rate is not a record of
 * what was charged. Everything needed to reprint the invoice exactly as issued
 * lives on the row, including the seller's GSTIN at the time.
 */
return new class extends Migration {
    public function up(): void
    {
        // The allocator. A row per series, incremented under a row lock, so two
        // simultaneous checkouts cannot be handed the same number — which is
        // what MAX(id)+1 would do, quietly, under exactly the load you want.
        Schema::create('number_sequences', function (Blueprint $t) {
            $t->string('key', 40)->primary();   // e.g. "order:2627"
            $t->unsignedBigInteger('next')->default(1);
            $t->timestamps();
        });

        Schema::table('orders', function (Blueprint $t) {
            $t->string('order_number', 20)->nullable()->unique()->after('id');
            $t->string('invoice_number', 20)->nullable()->unique()->after('order_number');
            $t->timestamp('invoice_issued_at')->nullable()->after('invoice_number');

            // What was charged, as charged. Nullable because an unpaid order has
            // no tax position yet, and 0.00 would be a claim rather than a blank.
            $t->decimal('taxable_value', 10, 2)->nullable();
            $t->decimal('tax_cgst', 10, 2)->nullable();
            $t->decimal('tax_sgst', 10, 2)->nullable();
            $t->decimal('tax_igst', 10, 2)->nullable();
            $t->decimal('tax_rate', 5, 2)->nullable();       // percent, e.g. 18.00
            $t->string('tax_mode', 10)->nullable();          // inclusive | exclusive
            $t->string('seller_gstin', 20)->nullable();
            $t->string('place_of_supply', 60)->nullable();
        });

        // Backfill, oldest first, so the series runs in the order things
        // actually happened rather than in whatever order the rows come back.
        $this->backfill();
    }

    /**
     * Existing orders get an order number; only the PAID ones get an invoice
     * number. A sale that happened should have an invoice, and giving it a
     * number now is better than it never having had one — but minting invoice
     * numbers for orders that were never paid would put fiction into the series.
     *
     * Idempotent at every step: re-running skips anything already numbered.
     */
    private function backfill(): void
    {
        $seq = [];
        $next = function (string $prefix, string $fy) use (&$seq): string {
            $key = "{$prefix}:{$fy}";
            $seq[$key] = ($seq[$key] ?? 0) + 1;
            return sprintf('%s-%s-%06d', $prefix, $fy, $seq[$key]);
        };

        // April to March. An order placed in January 2027 belongs to FY 2026-27.
        $fyOf = function ($date): string {
            $d     = \Illuminate\Support\Carbon::parse($date ?: now());
            $start = $d->month >= 4 ? $d->year : $d->year - 1;
            return substr((string) $start, 2, 2) . substr((string) ($start + 1), 2, 2);
        };

        foreach (DB::table('orders')->orderBy('created_at')->orderBy('id')->get() as $o) {
            $fy      = $fyOf($o->created_at);
            $updates = [];

            if (empty($o->order_number)) {
                $updates['order_number'] = $next('ORD', $fy);
            }
            if (empty($o->invoice_number) && $o->status === 'paid') {
                $updates['invoice_number']    = $next('INV', $fy);
                $updates['invoice_issued_at'] = $o->updated_at ?: $o->created_at;
            }

            if ($updates) DB::table('orders')->where('id', $o->id)->update($updates);
        }

        // Hand the live allocator a starting point past everything backfilled,
        // or the first real order would collide with a number already issued.
        foreach ($seq as $key => $used) {
            DB::table('number_sequences')->updateOrInsert(
                ['key' => $key],
                ['next' => $used + 1, 'created_at' => now(), 'updated_at' => now()],
            );
        }
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $t) {
            $t->dropColumn([
                'order_number', 'invoice_number', 'invoice_issued_at',
                'taxable_value', 'tax_cgst', 'tax_sgst', 'tax_igst',
                'tax_rate', 'tax_mode', 'seller_gstin', 'place_of_supply',
            ]);
        });
        Schema::dropIfExists('number_sequences');
    }
};
