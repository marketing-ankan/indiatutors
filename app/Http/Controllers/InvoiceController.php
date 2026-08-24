<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Support\SiteSettings;
use App\Support\TaxSettings;
use Illuminate\Http\Request;
use Mpdf\Mpdf;

/**
 * The order's invoice, as a PDF.
 *
 * ACCESS. This document carries a name, a home address, a phone number and what
 * somebody bought, so it is not fetched by guessing a URL. Three ways in, and
 * no others:
 *
 *   - the signed-in customer whose order it is
 *   - staff
 *   - a signed link, which is how a GUEST reaches their own invoice. Checkout
 *     is open without an account, so those buyers have no session to
 *     authenticate; Laravel's signature makes the URL itself the credential and
 *     it cannot be edited to point at somebody else's order.
 *
 * The order id alone is NOT enough, deliberately. Sequential ids mean anyone
 * could walk the range and collect other people's addresses.
 *
 * Generation follows CurriculumPdfController, which already solved mPDF on this
 * host — same temp directory, same fallback when a script outside the trimmed
 * font set appears, because a name can contain anything and a failed render
 * must not become a 500 for somebody who just wanted their receipt.
 */
class InvoiceController extends Controller
{
    public function show(Request $request, Order $order)
    {
        abort_unless($this->mayView($request, $order), 403,
            'This invoice belongs to a different account.');

        // An order that was never paid has no invoice number, and printing one
        // as though it were a tax invoice would misstate it. It is still worth
        // being able to print — people ask for a copy of what they ordered — so
        // it prints as an order summary under its order number instead.
        $heading = $order->invoice_number
            ? ($order->tax_rate && $order->totalTax() > 0 ? 'Tax Invoice' : 'Invoice')
            : 'Order Summary';

        $site = SiteSettings::all();

        $html = view('pdf.invoice', [
            'order'      => $order->load('items'),
            'site'       => $site,
            'entity'     => $site['entity_name'] ?: config('app.name'),
            'heading'    => $heading,
            // Read live rather than snapshotted: a footer note is a message from
            // the business, not a figure that has to match what was charged.
            'footerNote' => TaxSettings::all()['invoice_footer'],
        ])->render();

        $tmp = storage_path('app/mpdf');
        if (! is_dir($tmp)) mkdir($tmp, 0775, true);

        try {
            $pdf = $this->render($html, $order, $tmp, true);
        } catch (\Mpdf\MpdfException $e) {
            report($e);
            $pdf = $this->render($html, $order, $tmp, false);
        }

        $name = ($order->invoice_number ?: $order->order_number ?: ('order-' . $order->id)) . '.pdf';

        return response($pdf, 200, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="' . $name . '"',
            // Never cached by a shared proxy: this is one person's document.
            'Cache-Control'       => 'private, no-store, max-age=0, must-revalidate',
        ]);
    }

    private function mayView(Request $request, Order $order): bool
    {
        // hasValidSignature covers expiry as well as tampering.
        if ($request->hasValidSignature()) return true;

        $user = $request->user('sanctum') ?: $request->user();
        if (! $user) return false;

        return $user->role === 'admin' || ($order->user_id && $order->user_id === $user->id);
    }

    private function render(string $html, Order $order, string $tmp, bool $autoFont): string
    {
        $mpdf = new Mpdf([
            'tempDir'          => $tmp,
            'format'           => 'A4',
            'margin_top'       => 14,
            'margin_bottom'    => 22,
            'margin_left'      => 14,
            'margin_right'     => 14,
            'margin_footer'    => 8,
            'autoScriptToLang' => $autoFont,
            'autoLangToFont'   => $autoFont,
        ]);

        $ref = $order->invoice_number ?: $order->reference();
        $mpdf->SetTitle($ref . ' — Indiatutors Online');
        $mpdf->SetAuthor('Indiatutors Online');
        $mpdf->SetCreator('Indiatutors Online');
        $mpdf->WriteHTML($html);

        return $mpdf->Output('', \Mpdf\Output\Destination::STRING_RETURN);
    }
}
