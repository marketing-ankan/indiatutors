<?php
use App\Support\DocumentNumber;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Carbon;
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
 *
 * EVERY STEP HERE IS RESUMABLE, and that is not defensive padding. MySQL commits
 * each CREATE and ALTER on the spot and cannot roll one back, while Laravel writes
 * the `migrations` row only after up() returns. This file is fourteen separate
 * statements followed by a backfill that runs for as long as the order table is
 * long — so a process killed anywhere in it leaves committed schema that no
 * migrations row accounts for. deploy/deploy.sh already records this job being
 * killed on this host, and SchemaHealer re-runs the very same command inside a web
 * request under a far shorter limit. An unguarded re-run would then die on "table
 * already exists" on every retry for ever, taking every later migration with it.
 * Hence: create only what is absent, and resume the backfill rather than restart it.
 */
return new class extends Migration {
    /** Rows numbered per transaction. Small enough that a kill costs almost nothing. */
    private const CHUNK = 200;

    public function up(): void
    {
        // The allocator. A row per series, incremented under a row lock, so two
        // simultaneous checkouts cannot be handed the same number — which is
        // what MAX(id)+1 would do, quietly, under exactly the load you want.
        if (! Schema::hasTable('number_sequences')) {
            Schema::create('number_sequences', function (Blueprint $t) {
                $t->string('key', 40)->primary();   // e.g. "ord:2627"
                $t->unsignedBigInteger('next')->default(1);
                $t->timestamps();
            });
        }

        // One ALTER per column, so the guard has to be per column too: half of
        // this list can already exist from a run that did not finish.
        $columns = [
            'order_number'      => fn (Blueprint $t) => $t->string('order_number', 20)->nullable()->after('id'),
            'invoice_number'    => fn (Blueprint $t) => $t->string('invoice_number', 20)->nullable()->after('order_number'),
            'invoice_issued_at' => fn (Blueprint $t) => $t->timestamp('invoice_issued_at')->nullable()->after('invoice_number'),

            // What was charged, as charged. Nullable because an unpaid order has
            // no tax position yet, and 0.00 would be a claim rather than a blank.
            'taxable_value'   => fn (Blueprint $t) => $t->decimal('taxable_value', 10, 2)->nullable(),
            'tax_cgst'        => fn (Blueprint $t) => $t->decimal('tax_cgst', 10, 2)->nullable(),
            'tax_sgst'        => fn (Blueprint $t) => $t->decimal('tax_sgst', 10, 2)->nullable(),
            'tax_igst'        => fn (Blueprint $t) => $t->decimal('tax_igst', 10, 2)->nullable(),
            'tax_rate'        => fn (Blueprint $t) => $t->decimal('tax_rate', 5, 2)->nullable(),   // percent, e.g. 18.00
            'tax_mode'        => fn (Blueprint $t) => $t->string('tax_mode', 10)->nullable(),      // inclusive | exclusive
            'seller_gstin'    => fn (Blueprint $t) => $t->string('seller_gstin', 20)->nullable(),
            'place_of_supply' => fn (Blueprint $t) => $t->string('place_of_supply', 60)->nullable(),
        ];

        $existing = Schema::getColumnListing('orders');

        Schema::table('orders', function (Blueprint $t) use ($columns, $existing) {
            foreach ($columns as $name => $add) {
                if (! in_array($name, $existing, true)) $add($t);
            }
        });

        // The unique indexes are their own statements, added after all eleven
        // columns. Guarding on the column alone would let a run cut between the
        // two leave a number column with nothing enforcing that the numbers are
        // distinct — which is the entire reason these columns exist.
        foreach (['order_number', 'invoice_number'] as $column) {
            if (! Schema::hasIndex('orders', [$column], 'unique')) {
                Schema::table('orders', fn (Blueprint $t) => $t->unique($column));
            }
        }

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
     * RESUMABLE, which is a stronger claim than idempotent and the one that
     * matters. The first version counted in PHP from 1 and primed the live
     * allocator only after the loop, which is the wrong way round twice over: a
     * run cut half way left thousands of orders holding ORD-2627-000001 upwards
     * while `number_sequences` was still empty, so the next real checkout was
     * handed a number an order already had and died on the unique index — and a
     * re-run would have started counting at 1 again and collided with its own
     * earlier output. Numbers now come from the same allocator DocumentNumber
     * mints from, a chunk at a time, with each chunk's reservation and its rows
     * committed together. Cut this anywhere and what was written is consistent;
     * the next run carries on from there.
     */
    private function backfill(): void
    {
        // Every order gets a number, oldest first, so the series runs in the
        // order things actually happened.
        $this->number(
            fn () => DB::table('orders')->whereNull('order_number')
                ->orderBy('created_at')->orderBy('id')->limit(self::CHUNK)->get(),
            DocumentNumber::ORDER,
            fn ($o, string $number) => ['order_number' => $number],
        );

        $this->number(
            fn () => DB::table('orders')->where('status', 'paid')->whereNull('invoice_number')
                ->orderBy('created_at')->orderBy('id')->limit(self::CHUNK)->get(),
            DocumentNumber::INVOICE,
            fn ($o, string $number) => [
                'invoice_number'    => $number,
                'invoice_issued_at' => $o->updated_at ?: $o->created_at,
            ],
        );
    }

    /**
     * Number one batch at a time until there is nothing left unnumbered.
     *
     * A draining loop rather than a paged scan: every row a pass reads is a row
     * that pass numbers, so it leaves the unnumbered set and the next pass is
     * strictly smaller. That is what makes an interrupted run pick up where it
     * stopped instead of walking the whole table again.
     */
    private function number(callable $unnumbered, string $prefix, callable $values): void
    {
        while (($rows = $unnumbered())->isNotEmpty()) {
            // Grouped by financial year because each year is its own series.
            $byYear = $rows->groupBy(fn ($o) => $this->fyOf($o));

            foreach ($byYear as $group) {
                // Re-derived from a row rather than read back off the group key:
                // PHP turns a numeric array key into an int, which would quietly
                // strip the leading zero off a year like "0910".
                $fy = $this->fyOf($group->first());

                DB::transaction(function () use ($prefix, $fy, $group, $values) {
                    // Reserve first, write second, both inside this transaction:
                    // the allocator can then never sit behind the numbers already
                    // on the rows, whichever statement the process dies on.
                    $n = $this->reserve($prefix, $fy, $group->count());

                    foreach ($group as $o) {
                        DB::table('orders')->where('id', $o->id)->update(
                            $values($o, sprintf('%s-%s-%06d', $prefix, $fy, $n++))
                        );
                    }
                });
            }
        }
    }

    /** April to March: an order placed in January 2027 belongs to FY 2026-27. */
    private function fyOf(object $order): string
    {
        return DocumentNumber::financialYear(Carbon::parse($order->created_at ?: now()));
    }

    /**
     * Take a block of $count numbers from the live allocator, return the first.
     *
     * Must be called inside the transaction that writes them, for the same
     * reason DocumentNumber says so: numbers allocated in one transaction and
     * saved in another leave a hole in the series when the save does not land.
     */
    private function reserve(string $prefix, string $fy, int $count): int
    {
        // Exactly the key DocumentNumber will look for later. The first version
        // seeded "ORD:2627" while the allocator reads "ord:2627", and that only
        // looked correct because MySQL's default collation ignores case — on
        // SQLite the seeded row is invisible and the series restarts at 1.
        $key = strtolower($prefix) . ':' . $fy;

        $row = DB::table('number_sequences')->where('key', $key)->lockForUpdate()->first();

        if (! $row) {
            DB::table('number_sequences')->insert([
                'key' => $key, 'next' => 1, 'created_at' => now(), 'updated_at' => now(),
            ]);
            $first = 1;
        } else {
            $first = (int) $row->next;
        }

        DB::table('number_sequences')->where('key', $key)
            ->update(['next' => $first + $count, 'updated_at' => now()]);

        return $first;
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
