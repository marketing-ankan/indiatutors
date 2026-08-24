<?php
namespace Tests\Feature;

use App\Models\Order;
use App\Models\Setting;
use App\Models\User;
use App\Support\DocumentNumber;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\URL;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Order numbers, invoice numbers, and the tax snapshot on them.
 *
 * Two properties are worth more than the rest and both are invisible in normal
 * use: an invoice number is never issued twice, and it is never issued for
 * something that was not sold. Everything else here is arithmetic that must add
 * up on a document somebody may have to justify later.
 */
class OrderNumberingAndInvoiceTest extends TestCase
{
    use RefreshDatabase;

    private function order(array $attrs = []): Order
    {
        return Order::create($attrs + [
            'first_name' => 'Asha', 'last_name' => 'Nair', 'email' => 'asha@example.test',
            'phone' => '9000000000', 'country' => 'IN', 'address_1' => '1 Park Street',
            'city' => 'Kolkata', 'state' => 'West Bengal', 'postcode' => '700016',
            'total' => 1180, 'currency' => 'INR', 'status' => 'pending',
        ]);
    }

    public function test_every_order_is_given_a_number_when_it_is_placed(): void
    {
        $o = $this->order();

        $this->assertMatchesRegularExpression('/^ORD-\d{4}-\d{6}$/', $o->order_number);
        $this->assertNull($o->invoice_number, 'Nothing has been sold yet.');
    }

    public function test_numbers_do_not_repeat(): void
    {
        $numbers = collect(range(1, 5))->map(fn () => $this->order()->order_number);

        $this->assertCount(5, $numbers->unique(), 'Two orders shared a number: ' . $numbers->implode(', '));
    }

    /**
     * An invoice number is minted only on the transition into paid. An order
     * that is abandoned or cancelled must not consume one — a tax invoice
     * series is expected to be continuous, and the gaps are what get questioned.
     */
    public function test_an_invoice_number_is_issued_only_when_the_order_is_paid(): void
    {
        $unpaid    = $this->order();
        $cancelled = $this->order();
        $cancelled->update(['status' => 'cancelled']);

        $this->assertNull($unpaid->fresh()->invoice_number);
        $this->assertNull($cancelled->fresh()->invoice_number);

        $paid = $this->order();
        $paid->update(['status' => 'paid']);

        $this->assertMatchesRegularExpression('/^INV-\d{4}-\d{6}$/', $paid->fresh()->invoice_number);
        $this->assertNotNull($paid->fresh()->invoice_issued_at);
    }

    public function test_re_saving_a_paid_order_does_not_issue_a_second_invoice(): void
    {
        $o = $this->order();
        $o->update(['status' => 'paid']);
        $first = $o->fresh()->invoice_number;

        $o->update(['status' => 'paid']);
        $o->update(['order_notes' => 'called the customer']);

        $this->assertSame($first, $o->fresh()->invoice_number);
    }

    /**
     * The customer has this document. Bouncing an order out of paid and back
     * must not silently hand them a second number for one sale.
     */
    public function test_an_invoice_number_survives_a_status_round_trip(): void
    {
        $o = $this->order();
        $o->update(['status' => 'paid']);
        $first = $o->fresh()->invoice_number;

        $o->update(['status' => 'pending']);
        $o->update(['status' => 'paid']);

        $this->assertSame($first, $o->fresh()->invoice_number);
    }

    public function test_the_financial_year_runs_april_to_march(): void
    {
        $this->assertSame('2627', DocumentNumber::financialYear(Carbon::parse('2026-04-01')));
        $this->assertSame('2627', DocumentNumber::financialYear(Carbon::parse('2027-03-31')));
        $this->assertSame('2526', DocumentNumber::financialYear(Carbon::parse('2026-03-31')));
        $this->assertSame('2728', DocumentNumber::financialYear(Carbon::parse('2027-04-01')));
    }

    /** An invoice number has to fit the 16 characters Indian GST rules allow. */
    public function test_an_invoice_number_fits_the_gst_length_limit(): void
    {
        $o = $this->order();
        $o->update(['status' => 'paid']);

        $this->assertLessThanOrEqual(16, strlen($o->fresh()->invoice_number));
        $this->assertMatchesRegularExpression('/^[A-Za-z0-9\/-]+$/', $o->fresh()->invoice_number);
    }

    // --- tax -------------------------------------------------------------

    public function test_with_gst_off_nothing_is_claimed_about_tax(): void
    {
        $o = $this->order();
        $o->update(['status' => 'paid']);
        $o = $o->fresh();

        $this->assertSame(1180.0, (float) $o->taxable_value, 'The whole amount is the value of the supply.');
        $this->assertNull($o->tax_rate);
        $this->assertNull($o->tax_cgst);
        $this->assertNull($o->seller_gstin);
        $this->assertSame(0.0, $o->totalTax());
    }

    /**
     * The prices on this site are owner-set and are what customers were told
     * they would pay. Turning tax on must record how much of the total was tax,
     * never add to it.
     */
    public function test_enabling_gst_does_not_change_what_the_customer_pays(): void
    {
        Setting::put('gst_enabled', '1');
        Setting::put('gst_rate', '18');

        $o = $this->order(['total' => 1180]);
        $o->update(['status' => 'paid']);
        $o = $o->fresh();

        $this->assertSame(1180.0, (float) $o->total, 'The charge must be untouched.');
        $this->assertSame(1000.0, (float) $o->taxable_value);
        $this->assertEqualsWithDelta(180.0, $o->totalTax(), 0.01);
        $this->assertEqualsWithDelta((float) $o->total, $o->taxable_value + $o->totalTax(), 0.01,
            'Taxable value plus tax must equal the total exactly.');
    }

    public function test_a_buyer_in_the_sellers_state_is_charged_cgst_and_sgst(): void
    {
        Setting::put('gst_enabled', '1');
        Setting::put('seller_state', 'West Bengal');

        $o = $this->order(['state' => 'West Bengal']);
        $o->update(['status' => 'paid']);
        $o = $o->fresh();

        $this->assertEqualsWithDelta(90.0, (float) $o->tax_cgst, 0.01);
        $this->assertEqualsWithDelta(90.0, (float) $o->tax_sgst, 0.01);
        $this->assertNull($o->tax_igst);
    }

    public function test_a_buyer_in_another_state_is_charged_igst(): void
    {
        Setting::put('gst_enabled', '1');
        Setting::put('seller_state', 'West Bengal');

        $o = $this->order(['state' => 'Karnataka']);
        $o->update(['status' => 'paid']);
        $o = $o->fresh();

        $this->assertEqualsWithDelta(180.0, (float) $o->tax_igst, 0.01);
        $this->assertNull($o->tax_cgst);
        $this->assertSame('Karnataka', $o->place_of_supply);
    }

    /**
     * Rates change. A document already given to a customer must reprint exactly
     * as issued, so the figures are frozen on the row rather than recomputed.
     */
    public function test_the_tax_snapshot_does_not_move_when_the_rate_changes_later(): void
    {
        Setting::put('gst_enabled', '1');
        Setting::put('gst_rate', '18');

        $o = $this->order();
        $o->update(['status' => 'paid']);
        $issued = $o->fresh()->only(['tax_rate', 'taxable_value', 'tax_cgst', 'tax_sgst']);

        Setting::put('gst_rate', '28');
        $o->update(['order_notes' => 'anything']);

        $this->assertEquals($issued, $o->fresh()->only(['tax_rate', 'taxable_value', 'tax_cgst', 'tax_sgst']));
    }

    // --- the PDF and who may read it -------------------------------------

    public function test_the_invoice_pdf_renders(): void
    {
        $o = $this->order();
        $o->items()->create(['name' => 'Mathematics Grade 9-10 — One-to-One, Class 9', 'price' => 1180, 'qty' => 1]);
        $o->update(['status' => 'paid']);

        $res = $this->get(URL::temporarySignedRoute('orders.invoice', now()->addDay(), ['order' => $o->id]));

        $res->assertOk()->assertHeader('content-type', 'application/pdf');
        $this->assertStringStartsWith('%PDF', $res->getContent(), 'A PDF must actually be a PDF.');
    }

    /**
     * The document carries a name, a home address and a phone number. Order ids
     * are sequential, so if the id alone were enough anyone could walk the
     * range and collect them.
     */
    public function test_an_unsigned_stranger_cannot_read_someone_elses_invoice(): void
    {
        $o = $this->order();
        $o->update(['status' => 'paid']);

        $this->get("/orders/{$o->id}/invoice.pdf")->assertForbidden();

        Sanctum::actingAs(User::factory()->create(['role' => 'parent']));
        $this->get("/orders/{$o->id}/invoice.pdf")->assertForbidden();
    }

    public function test_the_buyer_and_staff_can_read_it(): void
    {
        $buyer = User::factory()->create(['role' => 'parent']);
        $o = $this->order(['user_id' => $buyer->id]);
        $o->update(['status' => 'paid']);

        Sanctum::actingAs($buyer);
        $this->get("/orders/{$o->id}/invoice.pdf")->assertOk();

        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
        $this->get("/orders/{$o->id}/invoice.pdf")->assertOk();
    }

    public function test_a_tampered_signature_is_refused(): void
    {
        $mine  = $this->order();
        $mine->update(['status' => 'paid']);
        $other = $this->order(['email' => 'someone@else.test']);
        $other->update(['status' => 'paid']);

        $url = URL::temporarySignedRoute('orders.invoice', now()->addDay(), ['order' => $mine->id]);

        // Point the signed link at a different order and it must stop working.
        $this->get(str_replace("/orders/{$mine->id}/", "/orders/{$other->id}/", $url))
            ->assertForbidden();
    }

    // ---- round four ---------------------------------------------------------

    /**
     * Deleting the row deletes the number out of the series, and a tax invoice
     * series with a hole in it is what has to be explained later. The guard
     * keyed off `status`, which is mutable — paid, pending, Delete, gone.
     */
    public function test_an_issued_invoice_number_cannot_be_deleted_out_of_the_series(): void
    {
        $o = $this->order();
        $o->update(['status' => 'paid']);
        $number = $o->fresh()->invoice_number;

        // The two clicks that used to work.
        $o->update(['status' => 'pending']);

        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
        $this->deleteJson("/api/admin/orders/{$o->id}")->assertStatus(422);

        $this->assertDatabaseHas('orders', ['id' => $o->id, 'invoice_number' => $number]);
    }

    /** An order that never reached paid has no number to protect. */
    public function test_an_order_with_no_invoice_can_still_be_deleted(): void
    {
        $o = $this->order();

        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
        $this->deleteJson("/api/admin/orders/{$o->id}")->assertOk();

        $this->assertDatabaseMissing('orders', ['id' => $o->id]);
    }

    /**
     * GST is only ever taken OUT of the price. There is no mode that adds it on
     * top: that would raise every advertised price, and one that half-existed
     * printed an invoice whose lines summed to 118% of its own stated total.
     */
    public function test_there_is_no_tax_mode_that_adds_to_the_total(): void
    {
        Setting::put('gst_enabled', '1');
        Setting::put('gst_rate', '18');
        Setting::put('gst_mode', 'exclusive');   // refused by the rules; ignored here

        foreach ([999.99, 0.01, 1, 1180, 4999] as $amount) {
            Order::query()->delete();
            $o = $this->order(['total' => $amount]);
            $o->update(['status' => 'paid']);
            $o = $o->fresh();

            $this->assertEqualsWithDelta((float) $amount, (float) $o->total, 0.001,
                "Enabling GST changed the charge for {$amount}.");
            $this->assertEqualsWithDelta(
                (float) $o->total, $o->taxable_value + $o->totalTax(), 0.01,
                "Lines do not sum to the total for {$amount}.");
        }
    }

    /** Every GST slab must balance, not just 18%. */
    public function test_every_gst_slab_balances(): void
    {
        Setting::put('gst_enabled', '1');

        foreach ([5, 12, 18, 28] as $rate) {
            Setting::put('gst_rate', (string) $rate);
            Order::query()->delete();
            $o = $this->order(['total' => 999.99]);
            $o->update(['status' => 'paid']);
            $o = $o->fresh();

            $this->assertEqualsWithDelta(
                (float) $o->total, $o->taxable_value + $o->totalTax(), 0.01,
                "The {$rate}% slab does not balance.");
        }
    }

    // ---- round five: what the pre-merge pass found --------------------------

    /**
     * Two objects for one order, both told to become paid.
     *
     * A double-tapped pay button, or Razorpay's handler retried after a network
     * flap. Both instances loaded invoice_number as NULL, so the in-memory
     * guard let both mint: the second overwrote the first, and the first number
     * belonged to no order at all — while verify() had already returned it to
     * the buyer. Nothing in the schema catches it; the unique index prevents two
     * ORDERS sharing a number, not one order being renumbered.
     */
    public function test_two_instances_of_one_order_cannot_issue_two_numbers(): void
    {
        $o = $this->order();

        $a = Order::find($o->id);
        $b = Order::find($o->id);
        $a->update(['status' => 'paid']);
        $b->update(['status' => 'paid']);

        $number = $o->fresh()->invoice_number;

        $this->assertNotNull($number);
        $this->assertSame($number, $a->invoice_number, 'Instance A reports a number the order does not have.');
        $this->assertSame($number, $b->invoice_number);

        // ...and no number was minted that belongs to nothing.
        $issued = Order::whereNotNull('invoice_number')->pluck('invoice_number');
        $this->assertCount(1, $issued);
        $this->assertSame($number, $issued->first());
    }

    /**
     * A sale can be recorded as paid and never get its document: the status
     * write commits, and only then does the hook that issues the invoice run.
     * Re-saving does not recover it, because issuance keys off the TRANSITION.
     */
    public function test_a_paid_order_left_without_an_invoice_can_be_reconciled(): void
    {
        $o = $this->order();
        $o->update(['status' => 'paid']);

        // Exactly the state a failure inside the hook leaves behind.
        Order::withoutEvents(fn () => $o->forceFill([
            'invoice_number' => null, 'invoice_issued_at' => null, 'taxable_value' => null,
        ])->saveQuietly());
        $this->assertNull($o->fresh()->invoice_number);

        // Re-saving is NOT the recovery — proving why the command exists.
        $o->fresh()->update(['status' => 'paid']);
        $this->assertNull($o->fresh()->invoice_number);

        $this->assertSame(1, Order::issueMissingInvoices());
        $this->assertNotNull($o->fresh()->invoice_number);

        // Idempotent: a second run finds nothing and changes nothing.
        $number = $o->fresh()->invoice_number;
        $this->assertSame(0, Order::issueMissingInvoices());
        $this->assertSame($number, $o->fresh()->invoice_number);
    }

    public function test_the_reconcile_command_runs_and_reports(): void
    {
        $o = $this->order();
        $o->update(['status' => 'paid']);
        Order::withoutEvents(fn () => $o->forceFill(['invoice_number' => null])->saveQuietly());

        $this->artisan('invoices:issue-missing --dry-run')->assertSuccessful();
        $this->assertNull($o->fresh()->invoice_number, 'A dry run must not issue anything.');

        $this->artisan('invoices:issue-missing')->assertSuccessful();
        $this->assertNotNull($o->fresh()->invoice_number);
    }
}
