import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { placeOrder, verifyPayment } from '../lib/api.js';
import { cart, useCart, inrFmt } from '../lib/cart.js';
import { imageFor } from '../data/courseImages.js';

// Checkout — mirrors the live WooCommerce Blocks checkout: Contact
// information + Billing address + Payment options on the left, an Order
// summary rail on the right, and the classic Woo "Order received"
// confirmation. An empty cart redirects back to /cart, like live.
// Payment: when the server returns a `razorpay` payload (keys configured)
// the Razorpay modal opens and a verified payment marks the order paid;
// without keys the order stays a pending-payment stub.

// Load checkout.js once, lazily — only when a gateway order actually arrives.
let rzpScript = null;
const loadRazorpay = () => rzpScript ??= new Promise((resolve, reject) => {
  const s = document.createElement('script');
  s.src = 'https://checkout.razorpay.com/v1/checkout.js';
  s.onload = () => resolve();
  s.onerror = () => { rzpScript = null; reject(new Error('Razorpay script failed to load')); };
  document.head.appendChild(s);
});

const Field = ({ label, span, children }) => (
  <label className={`block ${span ? 'sm:col-span-2' : ''}`}>
    <span className="mb-1 block text-[0.83rem] font-semibold text-slate-700">{label}</span>
    {children}
  </label>
);
const inputCls = 'w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500';

function OrderReceived({ order, paymentNote }) {
  return (
    <div className="container-wide max-w-3xl py-12">
      <h1 className="font-heading text-3xl font-extrabold tracking-tight text-[#1A1A1A]">Order received</h1>
      <p className="mt-3 rounded-xl bg-green-50 px-5 py-4 font-semibold text-green-800 ring-1 ring-green-100">Thank you. Your order has been received.</p>
      <dl className="mt-6 grid grid-cols-2 gap-4 rounded-2xl border border-[#E7E7EF] bg-white p-6 sm:grid-cols-5">
        {[['Order number', `#${order.number}`], ['Date', order.date], ['Email', order.email], ['Total', inrFmt(order.total)], ['Payment method', 'Razorpay']].map(([t, v]) => (
          <div key={t} className="min-w-0">
            <dt className="text-[0.72rem] font-bold uppercase tracking-wide text-slate-400">{t}</dt>
            <dd className="mt-1 truncate text-sm font-semibold text-slate-800" title={String(v)}>{v}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-6 rounded-2xl border border-[#E7E7EF] bg-white p-6">
        <h2 className="font-heading mb-3 text-lg font-extrabold text-[#1A1A1A]">Order details</h2>
        {order.items.map(i => (
          <div key={i.name} className="flex justify-between border-b border-slate-50 py-2 text-sm">
            <span className="text-slate-700">{i.name} <span className="text-slate-400">× {i.qty}</span></span>
            <span className="font-semibold">{inrFmt(i.price)}</span>
          </div>
        ))}
        <div className="flex justify-between pt-3">
          <span className="font-heading font-bold">Total</span>
          <span className="font-heading font-extrabold">{inrFmt(order.total)}</span>
        </div>
      </div>
      <p className="mt-5 text-sm text-slate-500">
        {order.status === 'paid'
          ? <>✅ Payment received — your order is <strong>confirmed</strong>. Our team will reach out on the email/phone above to schedule your classes.</>
          : paymentNote || <>Your order is recorded as <strong>pending payment</strong> — our team will share a secure Razorpay payment link on the email/phone above to complete it.</>}
      </p>
      <Link to="/courses" className="mt-6 inline-block rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-700">Continue shopping</Link>
    </div>
  );
}

export default function CheckoutPage() {
  const items = useCart();
  const [f, setF] = useState({
    email: '', first_name: '', last_name: '', country: 'India',
    address_1: '', address_2: '', city: '', state: '', postcode: '', phone: '', order_notes: '',
  });
  const set = k => e => setF(s => ({ ...s, [k]: e.target.value }));
  const total = items.reduce((s, i) => s + Number(i.price || 0), 0);
  // Final confirmation: { order, paymentNote } once the flow settles (either
  // no gateway configured, payment verified, or the modal was dismissed).
  const [done, setDone] = useState(null);

  const verify = useMutation({
    mutationFn: verifyPayment,
    onSuccess: d => setDone({ order: d.order }),
  });

  const openRazorpayModal = async (rz, order) => {
    try {
      await loadRazorpay();
      new window.Razorpay({
        key: rz.key, order_id: rz.order_id, amount: rz.amount, currency: rz.currency,
        name: rz.name, prefill: rz.prefill,
        handler: resp => verify.mutate(resp, {
          onError: () => setDone({ order, paymentNote: '⚠️ We received your payment reference but could not verify it automatically — our team will confirm it and email you shortly.' }),
        }),
        modal: { ondismiss: () => setDone(d => d ?? { order }) },
      }).open();
    } catch {
      setDone({ order }); // script blocked/offline — fall back to the pending stub
    }
  };

  const submit = useMutation({
    mutationFn: () => placeOrder({ ...f, items: items.map(i => ({ slug: i.slug, kind: i.kind || 'course' })) }),
    onSuccess: data => {
      cart.clear();
      if (data.razorpay) openRazorpayModal(data.razorpay, data.order);
      else setDone({ order: data.order });
    },
  });

  if (done) return <OrderReceived order={done.order} paymentNote={done.paymentNote} />;
  if (submit.isSuccess) return (
    <div className="container-wide py-24 text-center text-slate-600">
      <p className="font-heading text-xl font-bold">Order recorded — complete the payment in the Razorpay window…</p>
      <p className="mt-2 text-sm text-slate-400">If the window doesn't appear, disable your popup blocker and refresh.</p>
    </div>
  );
  // Live parity: an empty checkout redirects to the cart — but only when no
  // order attempt is underway (clearing the cart on success re-renders with
  // zero items a beat before the success state commits).
  if (!items.length && submit.status === 'idle') return <Navigate to="/cart" replace />;

  return (
    <div className="container-wide py-12">
      <h1 className="font-heading mb-8 text-3xl font-extrabold tracking-tight text-[#1A1A1A]">Checkout</h1>
      <form onSubmit={e => { e.preventDefault(); submit.mutate(); }} className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          {/* CONTACT */}
          <section className="rounded-2xl border border-[#E7E7EF] bg-white p-6">
            <h2 className="font-heading mb-4 text-lg font-extrabold text-[#1A1A1A]">Contact information</h2>
            <Field label="Email address *"><input required type="email" value={f.email} onChange={set('email')} className={inputCls} placeholder="you@example.com" /></Field>
            <p className="mt-2 text-xs text-slate-400">We'll use this email to send you details and updates about your order.</p>
          </section>

          {/* BILLING */}
          <section className="rounded-2xl border border-[#E7E7EF] bg-white p-6">
            <h2 className="font-heading mb-4 text-lg font-extrabold text-[#1A1A1A]">Billing address</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="First name *"><input required value={f.first_name} onChange={set('first_name')} className={inputCls} /></Field>
              <Field label="Last name"><input value={f.last_name} onChange={set('last_name')} className={inputCls} /></Field>
              {/* Pinned to India, matching the Plans page (which dropped its own
                  country picker on 2026-08-10) and the policies, which say we
                  serve students across India. Offering a UAE or US billing
                  address here contradicted the Terms on the one page where the
                  customer actually pays. Shown read-only rather than hidden so
                  they can still see what is recorded against the order; `country`
                  stays in form state, so the payload is unchanged. Not a <label>:
                  there is no control to label. */}
              <div className="sm:col-span-2">
                <span className="mb-1 block text-[0.83rem] font-semibold text-slate-700">Country / Region</span>
                <p className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600">India</p>
              </div>
              <Field label="Address *" span><input required value={f.address_1} onChange={set('address_1')} className={inputCls} placeholder="House number and street name" /></Field>
              <Field label="Apartment, suite, etc. (optional)" span><input value={f.address_2} onChange={set('address_2')} className={inputCls} /></Field>
              <Field label="City *"><input required value={f.city} onChange={set('city')} className={inputCls} /></Field>
              <Field label="State"><input value={f.state} onChange={set('state')} className={inputCls} /></Field>
              <Field label="PIN Code"><input value={f.postcode} onChange={set('postcode')} className={inputCls} inputMode="numeric" /></Field>
              <Field label="Phone"><input type="tel" value={f.phone} onChange={set('phone')} className={inputCls} placeholder="+91 98765 43210" /></Field>
            </div>
          </section>

          {/* PAYMENT */}
          <section className="rounded-2xl border border-[#E7E7EF] bg-white p-6">
            <h2 className="font-heading mb-4 text-lg font-extrabold text-[#1A1A1A]">Payment options</h2>
            <label className="flex items-start gap-3 rounded-xl border border-brand-200 bg-[#F3F6FC] p-4">
              <input type="radio" checked readOnly className="mt-1" />
              <span>
                <span className="block text-sm font-bold text-slate-900">Razorpay (UPI · Cards · Netbanking)</span>
                <span className="mt-0.5 block text-xs text-slate-500">Pay securely via Razorpay. Your order is recorded first and a secure payment link completes it.</span>
              </span>
            </label>
            <Field label="Order notes (optional)"><textarea rows={3} value={f.order_notes} onChange={set('order_notes')} className={`${inputCls} mt-4`} placeholder="Notes about your order." /></Field>
          </section>

          <div className="flex items-center justify-between">
            <Link to="/cart" className="text-sm font-semibold text-brand-600 hover:text-brand-700">← Return to Cart</Link>
            <button type="submit" disabled={submit.isPending}
              className="rounded-[10px] bg-brand-600 px-8 py-3 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60">
              {submit.isPending ? 'Placing order…' : 'Place Order'}
            </button>
          </div>
          {submit.isError && <p className="text-sm text-red-600">Could not place the order — please check the required fields and try again.</p>}
        </div>

        {/* ORDER SUMMARY */}
        <aside className="rounded-2xl border border-[#E7E7EF] bg-white p-5 lg:sticky lg:top-24">
          <h2 className="font-heading border-b border-slate-100 pb-3 text-lg font-extrabold text-[#1A1A1A]">Order summary</h2>
          {items.map(i => (
            <div key={i.slug} className="flex items-center gap-3 border-b border-slate-50 py-3">
              <span className="block h-12 w-14 shrink-0 overflow-hidden rounded-md bg-[#F3F6FC]">
                {imageFor(i) && <img src={imageFor(i)} alt="" className="h-full w-full object-cover" loading="lazy" />}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800">{i.name}</span>
              <span className="text-sm font-bold">{inrFmt(i.price)}</span>
            </div>
          ))}
          <div className="flex items-center justify-between border-b border-slate-100 py-3 text-sm">
            <span className="text-slate-500">Subtotal</span><span className="font-semibold">{inrFmt(total)}</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="font-heading font-bold">Total</span>
            <span className="font-heading text-xl font-extrabold">{inrFmt(total)}</span>
          </div>
        </aside>
      </form>
    </div>
  );
}
