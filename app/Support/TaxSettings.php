<?php
namespace App\Support;

use App\Models\Setting;

/**
 * GST configuration, and the arithmetic that turns an order total into a tax
 * breakdown.
 *
 * TWO DELIBERATE DEFAULTS, both chosen so that installing this changes nothing:
 *
 * 1. GST IS OFF. Whether this business is registered, and at what rate its
 *    services are taxed, is a question for its accountant and not one this code
 *    should answer. Education services in India are taxed differently depending
 *    on what is being taught and to whom, and guessing a rate would put a wrong
 *    number on a legal document. Off means invoices print with no tax lines at
 *    all, which is the correct appearance for an unregistered seller.
 *
 * 2. WHEN TURNED ON, TAX IS INCLUSIVE BY DEFAULT. The prices on this site are
 *    owner-set and are what customers have been told they will pay. Adding tax
 *    on top would silently raise every price; taking it out of the total
 *    changes nothing about what is charged and only records how much of it was
 *    tax. Exclusive mode exists for when the owner decides otherwise, and that
 *    is their decision to make explicitly rather than one made for them by a
 *    default.
 *
 * CGST/SGST versus IGST is decided by where the customer is. Same state as the
 * seller, the tax splits in half between centre and state; different state, it
 * is one integrated amount. Getting this wrong on an invoice is one of the more
 * annoying things to correct after the fact, so it is computed from the state
 * recorded on the order rather than assumed.
 */
class TaxSettings
{
    /** key => [default, rule, label] — same shape as SiteSettings. */
    public const FIELDS = [
        'gst_enabled'      => ['0',  'nullable|in:0,1',              'Charge GST'],
        'gst_rate'         => ['18', 'nullable|numeric|min:0|max:50', 'GST rate (%)'],
        'gst_mode'         => ['inclusive', 'nullable|in:inclusive,exclusive', 'Prices include GST'],
        'gstin'            => [null, 'nullable|string|max:20',       'GSTIN'],
        'seller_state'     => ['West Bengal', 'nullable|string|max:60', 'State of supply'],
        'invoice_footer'   => [null, 'nullable|string|max:500',      'Invoice footer note'],
    ];

    public static function all(): array
    {
        $out = [];
        foreach (self::FIELDS as $key => [$default]) {
            $v = Setting::get($key);
            $out[$key] = ($v === null || $v === '') ? $default : $v;
        }
        return $out;
    }

    public static function rules(): array
    {
        $rules = [];
        foreach (self::FIELDS as $key => [, $rule]) $rules[$key] = $rule;
        return $rules;
    }

    public static function enabled(): bool
    {
        return self::all()['gst_enabled'] === '1';
    }

    /**
     * Break a gross total into taxable value and tax.
     *
     * Returns the SNAPSHOT written onto the order — every figure the invoice
     * needs, so reprinting it later cannot pick up a rate that changed since.
     *
     * @param  float   $total       what the customer is charged, all in
     * @param  ?string $buyerState  the state on the order, for the split
     */
    public static function breakdown(float $total, ?string $buyerState): array
    {
        $cfg  = self::all();
        $rate = (float) $cfg['gst_rate'];

        if ($cfg['gst_enabled'] !== '1' || $rate <= 0) {
            // Not registered, or nothing to charge: the whole amount is the
            // value of the supply and there is no tax to report.
            return [
                'taxable_value'   => round($total, 2),
                'tax_cgst'        => null,
                'tax_sgst'        => null,
                'tax_igst'        => null,
                'tax_rate'        => null,
                'tax_mode'        => null,
                'seller_gstin'    => null,
                'place_of_supply' => $buyerState ?: null,
            ];
        }

        $inclusive = $cfg['gst_mode'] !== 'exclusive';

        // Inclusive: the total already contains the tax, so the taxable value
        // is what is left once it is removed. Exclusive is not used to inflate
        // the charge here — the order total is still the total — it simply
        // treats that total as the pre-tax value, which is what an owner who
        // chooses that mode is asserting about their own prices.
        $taxable = $inclusive ? $total / (1 + $rate / 100) : $total;
        $tax     = $inclusive ? $total - $taxable : $total * ($rate / 100);

        $sameState = $buyerState
            && strcasecmp(trim($buyerState), trim((string) $cfg['seller_state'])) === 0;

        // Halves are rounded independently and the second is taken as the
        // remainder, so CGST + SGST always adds back to the tax exactly. Two
        // round($tax/2) calls can differ from the total by a paisa, and an
        // invoice whose parts do not sum to its total is the kind of thing an
        // auditor notices before anyone else does.
        $cgst = $sameState ? round($tax / 2, 2) : null;
        $sgst = $sameState ? round($tax - $cgst, 2) : null;

        return [
            'taxable_value'   => round($taxable, 2),
            'tax_cgst'        => $cgst,
            'tax_sgst'        => $sgst,
            'tax_igst'        => $sameState ? null : round($tax, 2),
            'tax_rate'        => $rate,
            'tax_mode'        => $inclusive ? 'inclusive' : 'exclusive',
            'seller_gstin'    => $cfg['gstin'] ?: null,
            'place_of_supply' => $buyerState ?: null,
        ];
    }
}
