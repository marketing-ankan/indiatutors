{{--
  Tax invoice — generated server-side by mPDF.

  Like the curriculum PDF, this is NOT website markup: mPDF renders an older CSS
  subset with no flexbox or grid, so anything that needs two things on one line
  uses a table. That is the idiomatic approach here, not a workaround.

  The document prints only what the order actually recorded. When GST was off at
  the time of sale the tax rows are absent altogether and the heading reads
  "Invoice" rather than "Tax Invoice", because calling a document a tax invoice
  when no tax was charged — or showing a GSTIN the seller did not have — would
  misstate it. Every figure comes off the frozen snapshot on the order, never
  from today's settings.
--}}
@php
    $tax      = $order->totalTax();
    $hasTax   = $order->tax_rate && $tax > 0;
    $money    = fn ($n) => '₹' . number_format((float) $n, 2);
    $buyer    = trim($order->first_name . ' ' . ($order->last_name ?? ''));
    $addr     = array_filter([$order->address_1, $order->address_2, $order->city, $order->state, $order->postcode]);
@endphp
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<style>
  @page { margin: 14mm 14mm 22mm; footer: html_ftr; }

  body { font-family: sans-serif; font-size: 10pt; color: #1a1a1a; line-height: 1.45; }

  .brand      { font-size: 17pt; font-weight: bold; color: #1E40AF; }
  .brand span { color: #0B1220; }
  .muted      { color: #667085; }
  .small      { font-size: 8.5pt; }
  .right      { text-align: right; }

  .doctitle {
    font-size: 13pt; font-weight: bold; color: #0B1220;
    letter-spacing: .5px; text-transform: uppercase;
  }

  table.layout { width: 100%; border-collapse: collapse; }
  table.layout td { vertical-align: top; padding: 0; }

  .panel { background: #F4F7FE; padding: 7px 9px; }

  table.lines { width: 100%; border-collapse: collapse; margin-top: 14px; }
  table.lines th {
    background: #1E40AF; color: #fff; font-size: 9pt; text-align: left;
    padding: 7px 8px; font-weight: bold;
  }
  table.lines td { padding: 7px 8px; border-bottom: 1px solid #E7E7EF; }
  table.lines tr.alt td { background: #FAFBFF; }

  table.totals { width: 100%; border-collapse: collapse; }
  table.totals td { padding: 4px 8px; }
  table.totals tr.grand td {
    border-top: 1.5px solid #0B1220; font-weight: bold; font-size: 11.5pt; padding-top: 7px;
  }

  .paidstamp {
    border: 1.5px solid #1a7f37; color: #1a7f37;
    padding: 4px 10px; font-weight: bold; font-size: 10pt; letter-spacing: 1px;
  }
  .duestamp { border: 1.5px solid #B45309; color: #B45309; padding: 4px 10px; font-weight: bold; font-size: 10pt; }
</style>
</head>
<body>

<htmlpagefooter name="ftr">
  <div class="small muted" style="border-top:1px solid #E7E7EF; padding-top:5px;">
    <table class="layout"><tr>
      <td>{{ $entity }} · {{ $site['contact_email'] }} · {{ $site['contact_phone'] }}</td>
      <td class="right">{{ $heading }} {{ $order->invoice_number ?: $order->reference() }} · Page {PAGENO} of {nbpg}</td>
    </tr></table>
  </div>
</htmlpagefooter>

{{-- Masthead --}}
<table class="layout">
  <tr>
    <td width="55%">
      <div class="brand">INDIATUTORS<span>ONLINE</span></div>
      <div class="small muted" style="margin-top:4px;">
        {{ $entity }}<br>
        {{ $site['contact_address'] }}<br>
        {{ $site['contact_email'] }} · {{ $site['contact_phone'] }}
        @if ($order->seller_gstin)
          <br><strong>GSTIN: {{ $order->seller_gstin }}</strong>
        @endif
      </div>
    </td>
    <td width="45%" class="right">
      <div class="doctitle">{{ $heading }}</div>
      <div style="margin-top:6px;">
        <span class="muted small">{{ $order->invoice_number ? 'Invoice no.' : 'Order no.' }}</span><br>
        <strong style="font-size:11.5pt;">{{ $order->invoice_number ?: $order->order_number }}</strong>
      </div>
      <div class="small muted" style="margin-top:5px;">
        Date: {{ ($order->invoice_issued_at ?: $order->created_at)->timezone('Asia/Kolkata')->format('j F Y') }}
        @if ($order->invoice_number && $order->order_number)
          <br>Order: {{ $order->order_number }}
        @endif
      </div>
      <div style="margin-top:8px;">
        @if ($order->status === 'paid')
          <span class="paidstamp">PAID</span>
        @else
          <span class="duestamp">{{ strtoupper($order->status) }}</span>
        @endif
      </div>
    </td>
  </tr>
</table>

<div style="height:14px;"></div>

{{-- Parties --}}
<table class="layout">
  <tr>
    <td width="49%" class="panel">
      <div class="small muted" style="text-transform:uppercase; letter-spacing:.5px;">Billed to</div>
      <div style="margin-top:3px;"><strong>{{ $buyer ?: $order->email }}</strong></div>
      <div class="small">
        @foreach ($addr as $line) {{ $line }}<br> @endforeach
        {{ $order->email }}@if ($order->phone) · {{ $order->phone }} @endif
      </div>
    </td>
    <td width="2%"></td>
    <td width="49%" class="panel">
      <div class="small muted" style="text-transform:uppercase; letter-spacing:.5px;">Details</div>
      <table class="layout small" style="margin-top:3px;">
        <tr><td>Payment</td><td class="right"><strong>{{ $order->payment_method ?: '—' }}</strong></td></tr>
        @if ($order->place_of_supply)
          <tr><td>Place of supply</td><td class="right"><strong>{{ $order->place_of_supply }}</strong></td></tr>
        @endif
        @if ($hasTax)
          <tr><td>GST rate</td><td class="right"><strong>{{ rtrim(rtrim(number_format($order->tax_rate, 2), '0'), '.') }}%</strong></td></tr>
        @endif
        @if ($order->razorpay_payment_id)
          <tr><td>Payment ref.</td><td class="right">{{ $order->razorpay_payment_id }}</td></tr>
        @endif
      </table>
    </td>
  </tr>
</table>

{{-- Lines --}}
<table class="lines">
  <thead>
    <tr>
      <th width="6%">#</th>
      <th width="46%">Description</th>
      <th width="16%">Code</th>
      <th width="10%" class="right">Qty</th>
      <th width="22%" class="right">Amount</th>
    </tr>
  </thead>
  <tbody>
    @foreach ($order->items as $i => $item)
      <tr @if ($i % 2) class="alt" @endif>
        <td>{{ $i + 1 }}</td>
        <td>{{ $item->name }}</td>
        {{-- The code recorded ON THE LINE, so a reprint years later still names
             what was sold even if the catalogue has moved on. --}}
        <td class="small muted">{{ $item->sku ?: '—' }}</td>
        <td class="right">{{ $item->qty }}</td>
        <td class="right">{{ $money($item->price * $item->qty) }}</td>
      </tr>
    @endforeach
  </tbody>
</table>

{{-- Totals --}}
<table class="layout" style="margin-top:12px;">
  <tr>
    <td width="52%" class="small muted">
      @if ($order->tax_mode === 'inclusive' && $hasTax)
        Prices shown are inclusive of GST. The tax below is the portion of the
        total that is tax, not an additional charge.
      @elseif (! $hasTax)
        No GST has been charged on this invoice.
      @endif
    </td>
    <td width="48%">
      <table class="totals">
        @if ($hasTax)
          <tr><td>Taxable value</td><td class="right">{{ $money($order->taxable_value) }}</td></tr>
          @if ($order->tax_igst)
            <tr><td>IGST @ {{ rtrim(rtrim(number_format($order->tax_rate, 2), '0'), '.') }}%</td>
                <td class="right">{{ $money($order->tax_igst) }}</td></tr>
          @else
            <tr><td>CGST @ {{ rtrim(rtrim(number_format($order->tax_rate / 2, 2), '0'), '.') }}%</td>
                <td class="right">{{ $money($order->tax_cgst) }}</td></tr>
            <tr><td>SGST @ {{ rtrim(rtrim(number_format($order->tax_rate / 2, 2), '0'), '.') }}%</td>
                <td class="right">{{ $money($order->tax_sgst) }}</td></tr>
          @endif
        @endif
        <tr class="grand">
          <td>Total {{ $order->currency ?: 'INR' }}</td>
          <td class="right">{{ $money($order->total) }}</td>
        </tr>
      </table>
    </td>
  </tr>
</table>

@if ($order->order_notes)
  <div class="panel small" style="margin-top:14px;">
    <strong>Notes:</strong> {{ $order->order_notes }}
  </div>
@endif

<div class="small muted" style="margin-top:18px;">
  @if ($footerNote)
    {{ $footerNote }}<br><br>
  @endif
  {{-- Says what it is. A computer-generated document with no signature block is
       normal and expected; saying so avoids anyone waiting for a stamped copy. --}}
  This is a computer-generated {{ strtolower($heading) }} and does not require a signature.
  Please quote {{ $order->invoice_number ?: $order->order_number }} in any correspondence about this order.
</div>

</body>
</html>
