<?php
namespace App\Models;

use App\Support\DocumentNumber;
use App\Support\TaxSettings;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

class Order extends Model {
    protected $guarded = [];
    protected $casts = [
        'total'             => 'float',
        'taxable_value'     => 'float',
        'tax_cgst'          => 'float',
        'tax_sgst'          => 'float',
        'tax_igst'          => 'float',
        'tax_rate'          => 'float',
        'invoice_issued_at' => 'datetime',
    ];

    public function items(): HasMany { return $this->hasMany(OrderItem::class); }
    // Nullable: checkout is open to guests, so an order need not have an account.
    public function user() { return $this->belongsTo(User::class); }

    /** What to call this order out loud. Falls back for rows predating numbering. */
    public function reference(): string
    {
        return $this->order_number ?: ('#' . $this->id);
    }

    public function totalTax(): float
    {
        return round((float) $this->tax_cgst + (float) $this->tax_sgst + (float) $this->tax_igst, 2);
    }

    /**
     * Numbering hangs off the model rather than the checkout controller,
     * because "paid" is reached from three unrelated places — a free order
     * unlocking itself, Razorpay verification, and a coordinator settling an
     * order by hand — and a rule enforced in three places is a rule that will
     * eventually be enforced in two.
     */
    protected static function booted(): void
    {
        static::creating(function (Order $order) {
            if (! $order->order_number) {
                $order->order_number = DocumentNumber::next(DocumentNumber::ORDER);
            }
        });

        static::updated(function (Order $order) {
            // Only on the TRANSITION into paid, and only once. Re-saving an
            // order that is already paid must not mint a second invoice for the
            // same sale — the same lesson the demo notification learned when it
            // fired on the payload instead of the change.
            if ($order->wasChanged('status') && $order->status === 'paid') {
                try {
                    $order->issueInvoice();
                } catch (\Throwable $e) {
                    // The sale is already committed — this hook runs after the
                    // status write. Failing the whole request now would tell a
                    // customer their payment did not go through when it did, so
                    // the failure is reported and left for issueMissingInvoices()
                    // rather than thrown. What must never happen is it passing
                    // unnoticed, which is what an empty catch would do.
                    report($e);
                }
            }
        });
    }

    /**
     * Issue the tax invoice for this order: a number, a date, and a frozen
     * record of the tax position at the moment of sale.
     *
     * Idempotent — an order that already has an invoice number keeps it. That
     * matters because a document a customer has already been given cannot be
     * quietly reissued under a different number, and because the paths into
     * here can legitimately run more than once.
     */
    public function issueInvoice(): void
    {
        if ($this->invoice_number) return;

        // Allocation and write commit together, or neither does. Taking the
        // number in one transaction and saving it in another leaves a hole in
        // the series whenever the save fails. Nested inside the checkout's own
        // transaction this becomes a savepoint, so a rolled-back order gives
        // its number back too.
        DB::transaction(function () {
            // Re-read the ROW under a lock, not the in-memory attribute.
            //
            // The guard above asks this object what it loaded, which is
            // useless when two objects loaded the same order before either
            // wrote: both saw null, both minted, the second overwrote the
            // first, and the first number was left belonging to no order at
            // all — while verify() had already returned it to the buyer. Two
            // instances of one order is not exotic: it is a double-tapped pay
            // button, or Razorpay's handler retried after a network flap.
            //
            // The lock makes the loser wait until the winner has committed, at
            // which point it reads a number and stops. The unique index cannot
            // help here: two ORDERS sharing a number is not what happens, one
            // order being renumbered is.
            $issued = static::whereKey($this->getKey())
                ->lockForUpdate()
                ->value('invoice_number');

            if ($issued) {
                // Somebody else got there. Adopt theirs so this instance stops
                // reporting a number the order does not have.
                $this->forceFill(['invoice_number' => $issued])->syncOriginal();
                return;
            }

            $snapshot = TaxSettings::breakdown((float) $this->total, $this->state);

            $this->forceFill($snapshot + [
                'invoice_number'    => DocumentNumber::next(DocumentNumber::INVOICE),
                'invoice_issued_at' => now(),
            ])->saveQuietly();   // quietly: this is a consequence of the save
                                 // that triggered it, not a new status change
                                 // to react to
        });
    }

    /**
     * Sales that were recorded as paid but never got their document.
     *
     * The status change and the invoice are two writes, and Eloquent fires the
     * second only after committing the first — so a deadlock, a lock-wait
     * timeout or a dropped connection inside issueInvoice() leaves the sale
     * recorded and the invoice unissued, with nothing on screen to say so. Nor
     * does re-saving fix it: issuance keys off the TRANSITION into paid, and a
     * row that is already paid never transitions again.
     *
     * So the gap is closed by looking for it rather than by hoping. Idempotent,
     * safe to run repeatedly, and it issues in id order so the series still
     * runs in the order the sales happened.
     *
     * @return int how many were issued
     */
    public static function issueMissingInvoices(): int
    {
        $n = 0;

        static::query()
            ->where('status', 'paid')
            ->whereNull('invoice_number')
            ->orderBy('id')
            ->each(function (Order $o) use (&$n) {
                $o->issueInvoice();
                if ($o->invoice_number) $n++;
            });

        return $n;
    }
}
