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
                $order->issueInvoice();
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
        // the series whenever the save fails — and an invoice series with a
        // hole in it is the thing somebody has to account for later. Nested
        // inside the checkout's own transaction this becomes a savepoint, so a
        // rolled-back order gives its number back too.
        DB::transaction(function () {
            $snapshot = TaxSettings::breakdown((float) $this->total, $this->state);

            $this->forceFill($snapshot + [
                'invoice_number'    => DocumentNumber::next(DocumentNumber::INVOICE),
                'invoice_issued_at' => now(),
            ])->saveQuietly();   // quietly: this is a consequence of the save
                                 // that triggered it, not a new status change
                                 // to react to
        });
    }
}
