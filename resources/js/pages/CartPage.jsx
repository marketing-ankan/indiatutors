import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { fetchCourses } from '../lib/api.js';
import { cart, useCart, cartItemOf, inrFmt } from '../lib/cart.js';

// Cart — mirrors the live WooCommerce Blocks cart: an empty state with the
// "New in store" cross-sell grid, and a filled two-column layout (items list
// left, "Cart totals" panel right). Quantities are locked to 1 per course,
// exactly like the live store (sold individually).

// The four products the live empty-cart cross-sell shows ("New in store").
const CROSS_SELL_SLUGS = ['digital-sat-psat-math', 'art-and-craft', 'act', 'nmsqt'];

function CrossSell() {
  const { data } = useQuery({ queryKey: ['courses', { per_page: 200 }], queryFn: () => fetchCourses({ per_page: 200 }) });
  const bySlug = new Map((data?.data ?? []).map(c => [c.slug, c]));
  const picks = CROSS_SELL_SLUGS.map(s => bySlug.get(s)).filter(Boolean);
  if (!picks.length) return null;
  return (
    <section className="mt-12">
      <h2 className="font-heading mb-6 text-center text-2xl font-extrabold text-[#1A1A1A]">New in store</h2>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {picks.map(c => (
          <div key={c.slug} className="group flex flex-col overflow-hidden rounded-[14px] border border-[#E7E7EF] bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <Link to={`/courses/${c.slug}`} className="block h-[150px] overflow-hidden bg-[#F3F6FC]">
              {c.image_url
                ? <img src={c.image_url} alt={c.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                : <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1E40AF] to-[#1E3A8A] font-heading text-3xl font-bold text-white/90">{c.name[0]}</span>}
            </Link>
            <div className="flex flex-1 flex-col p-4">
              <h3 className="font-heading text-sm font-bold leading-snug text-[#1A1A1A]">
                <Link to={`/courses/${c.slug}`}>{c.name}</Link>
              </h3>
              <p className="mt-1.5 text-[15px] font-extrabold text-brand-600">{inrFmt(c.effective_price)}</p>
              <button type="button" onClick={() => cart.add(cartItemOf(c))}
                className="mt-auto rounded-lg bg-brand-600 py-2 pt-2 text-[13px] font-bold text-white hover:bg-brand-700">
                Add to cart
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CouponRow() {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  return (
    <div className="border-b border-slate-100 py-3">
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className="text-sm font-semibold text-brand-600 hover:text-brand-700">Add a coupon</button>
      ) : (
        <form onSubmit={e => { e.preventDefault(); setErr(`Coupon "${code}" cannot be applied to your cart.`); }} className="flex gap-2">
          <input value={code} onChange={e => { setCode(e.target.value); setErr(''); }} required placeholder="Enter code"
            className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          <button type="submit" className="rounded-lg border border-brand-600 px-4 py-2 text-sm font-bold text-brand-600 hover:bg-brand-50">Apply</button>
        </form>
      )}
      {err && <p className="mt-2 text-xs text-red-600">{err}</p>}
    </div>
  );
}

export default function CartPage() {
  const items = useCart();
  const subtotal = items.reduce((s, i) => s + Number(i.price || 0), 0);

  if (!items.length) {
    return (
      <div className="container-wide py-12">
        <p className="rounded-xl bg-[#F3F6FC] px-6 py-5 text-center text-lg font-semibold text-slate-700">Your cart is currently empty!</p>
        <CrossSell />
      </div>
    );
  }

  return (
    <div className="container-wide py-12">
      <h1 className="font-heading mb-8 text-3xl font-extrabold tracking-tight text-[#1A1A1A]">Cart</h1>
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* ITEMS */}
        <div className="divide-y divide-slate-100 rounded-2xl border border-[#E7E7EF] bg-white px-5">
          {items.map(i => (
            <div key={i.slug} className="flex items-center gap-4 py-4">
              <Link to={`/courses/${i.slug}`} className="block h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-[#F3F6FC]">
                {i.image_url
                  ? <img src={i.image_url} alt="" className="h-full w-full object-cover" loading="lazy" />
                  : <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1E40AF] to-[#1E3A8A] font-heading font-bold text-white/90">{i.name[0]}</span>}
              </Link>
              <div className="min-w-0 flex-1">
                <Link to={`/courses/${i.slug}`} className="font-heading block truncate text-sm font-bold text-[#1A1A1A] hover:text-brand-600">{i.name}</Link>
                <p className="mt-0.5 text-xs text-slate-400">Qty 1 · sold individually</p>
              </div>
              <div className="text-sm font-bold text-slate-900">{inrFmt(i.price)}</div>
              <button type="button" onClick={() => cart.remove(i.slug)} aria-label={`Remove ${i.name} from cart`}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-500">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        {/* TOTALS */}
        <aside className="rounded-2xl border border-[#E7E7EF] bg-white p-5 lg:sticky lg:top-24">
          <h2 className="font-heading border-b border-slate-100 pb-3 text-lg font-extrabold text-[#1A1A1A]">Cart totals</h2>
          <div className="flex items-center justify-between border-b border-slate-100 py-3 text-sm">
            <span className="text-slate-500">Subtotal</span>
            <span className="font-semibold text-slate-900">{inrFmt(subtotal)}</span>
          </div>
          <CouponRow />
          <div className="flex items-center justify-between py-3">
            <span className="font-heading font-bold text-[#1A1A1A]">Total</span>
            <span className="font-heading text-xl font-extrabold text-[#1A1A1A]">{inrFmt(subtotal)}</span>
          </div>
          <Link to="/checkout" className="mt-2 block rounded-[10px] bg-brand-600 py-3 text-center text-sm font-bold text-white hover:bg-brand-700">Proceed to Checkout</Link>
          <Link to="/courses" className="mt-3 block text-center text-sm font-semibold text-brand-600 hover:text-brand-700">Continue shopping</Link>
        </aside>
      </div>
    </div>
  );
}
