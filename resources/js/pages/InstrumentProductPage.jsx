import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { CheckCircle2, ShieldCheck, Truck, MessageCircle } from 'lucide-react';
import { fetchStoreProduct, submitContact } from '../lib/api.js';
import { CATEGORY_BY_KEY } from '../data/store.js';

// Instrument/kit product detail (catalog + enquiry). No add-to-cart — an
// "Enquire to order" form captures the lead (into contact_messages) and a
// WhatsApp shortcut. Related items from the same category.

const inr = n => '₹' + Number(n).toLocaleString('en-IN');
const WHATSAPP = '919330811581';

function EnquiryForm({ product }) {
  const [f, setF] = useState({ name: '', email: '', phone: '', city: '' });
  const set = k => e => setF(s => ({ ...s, [k]: e.target.value }));
  const send = useMutation({
    mutationFn: () => submitContact({
      name: f.name, email: f.email, phone: f.phone || undefined,
      subject: `Product enquiry: ${product.name}`,
      message: [`Enquiry for "${product.name}" (${product.slug}), indicative ${inr(product.price)}.`, f.city && `Deliver to: ${f.city}`].filter(Boolean).join('\n'),
    }),
  });
  if (send.isSuccess) return (
    <div className="rounded-xl bg-green-50 p-4 text-sm font-semibold text-green-800 ring-1 ring-green-100">
      ✅ Enquiry sent! We'll share the current price, availability and delivery to your city shortly.
    </div>
  );
  const inp = 'w-full rounded-xl border-[1.5px] border-[#e6e8f0] px-4 py-3 text-[0.95rem] focus:border-brand-600 focus:outline-none';
  return (
    <form onSubmit={e => { e.preventDefault(); send.mutate(); }} className="space-y-3">
      <input required value={f.name} onChange={set('name')} placeholder="Your Name *" aria-label="Your name" className={inp} />
      <input required type="email" value={f.email} onChange={set('email')} placeholder="Email *" aria-label="Email" className={inp} />
      <input type="tel" value={f.phone} onChange={set('phone')} placeholder="WhatsApp / Phone" aria-label="Phone" className={inp} />
      <input value={f.city} onChange={set('city')} placeholder="Delivery city" aria-label="Delivery city" className={inp} />
      <button type="submit" disabled={send.isPending}
        className="w-full rounded-full bg-brand-600 py-3.5 font-extrabold tracking-wide text-white shadow-[0_10px_24px_rgba(30,64,175,.32)] transition hover:bg-[#0B1220] disabled:opacity-60">
        {send.isPending ? 'Sending…' : 'Enquire to Order'}
      </button>
      {send.isError && <p className="text-xs text-red-600">Could not send — please check the fields and try again.</p>}
    </form>
  );
}

export default function InstrumentProductPage() {
  const { slug } = useParams();
  const { data, isLoading, isError } = useQuery({ queryKey: ['store-product', slug], queryFn: () => fetchStoreProduct(slug) });

  if (isLoading) return <div className="container-wide py-20 text-slate-500">Loading…</div>;
  if (isError || !data?.data) return (
    <div className="container-wide py-20 text-center">
      <h1 className="text-2xl font-bold">Product not found</h1>
      <Link to="/instruments" className="mt-4 inline-block text-brand-600">← Back to the store</Link>
    </div>
  );

  const p = data.data;
  const related = data.related ?? [];
  const cat = CATEGORY_BY_KEY[p.category];
  const waText = encodeURIComponent(`Hi! I'd like to order the "${p.name}" from Indiatutors Online. Could you share the price and delivery details?`);

  return (
    <div className="bg-[#f9f9fc]">
      <div className="container-wide py-4 text-xs text-slate-500">
        <Link to="/" className="hover:text-brand-600">Home</Link> / <Link to="/instruments" className="hover:text-brand-600">Store</Link>
        {cat && <> / <Link to={`/instruments`} className="hover:text-brand-600">{cat.name}</Link></>} / <span className="text-slate-700">{p.name}</span>
      </div>

      <div className="container-wide grid grid-cols-1 items-start gap-8 pb-16 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-[220px_minmax(0,1fr)]">
            <div className="flex h-[220px] items-center justify-center rounded-2xl bg-gradient-to-br from-[#F4F7FE] to-[#E8ECF7] text-7xl ring-1 ring-slate-100">
              {p.image_url ? <img src={p.image_url} alt={p.name} className="h-full w-full rounded-2xl object-cover" /> : (cat?.icon || '🎵')}
            </div>
            <div>
              {cat && <Link to="/instruments" className="text-xs font-bold uppercase tracking-wider text-brand-600">{cat.icon} {cat.name}</Link>}
              <h1 className="font-heading mt-1 text-2xl font-extrabold tracking-tight text-[#0B1220] sm:text-3xl">{p.name}</h1>
              <p className="mt-3 flex items-baseline gap-2">
                <span className="font-heading text-3xl font-extrabold text-brand-600">{inr(p.price)}</span>
                <span className="text-sm text-slate-400">indicative price</span>
              </p>
              {p.blurb && <p className="mt-3 leading-relaxed text-slate-600">{p.blurb}</p>}
              <ul className="mt-5 space-y-2 text-sm text-slate-600">
                {['Matched to your child\'s classes and age', 'Genuine, class-ready equipment', 'Delivered across India — enquire for your city'].map(t => (
                  <li key={t} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />{t}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[[ShieldCheck, 'Class-ready', 'Picked to work with our courses'], [Truck, 'Pan-India delivery', 'Ships to your city on confirmation'], [MessageCircle, 'Talk first', 'We recommend before you buy']].map(([Icon, t, d]) => (
              <div key={t} className="rounded-xl border border-[#e6e8f0] bg-white p-4">
                <Icon className="h-5 w-5 text-brand-600" />
                <div className="mt-2 text-sm font-bold text-[#0B1220]">{t}</div>
                <div className="text-xs text-slate-500">{d}</div>
              </div>
            ))}
          </div>

          {related.length > 0 && (
            <div className="mt-10">
              <h2 className="font-heading mb-4 text-lg font-extrabold text-[#0B1220]">More in {cat?.name}</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {related.map(r => (
                  <Link key={r.slug} to={`/instruments/${r.slug}`} className="group rounded-2xl border border-[#E7E7EF] bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-lg">
                    <div className="mb-2 text-3xl">{CATEGORY_BY_KEY[r.category]?.icon || '🎵'}</div>
                    <div className="text-sm font-bold leading-snug text-[#1A1A1A] group-hover:text-brand-600">{r.name}</div>
                    <div className="mt-1 text-sm font-extrabold text-brand-600">{inr(r.price)}</div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ENQUIRY RAIL */}
        <aside className="rounded-2xl bg-white p-6 shadow-[0_4px_24px_rgba(30,64,175,.10)] ring-1 ring-slate-100 lg:sticky lg:top-24">
          <h2 className="font-heading mb-1 text-lg font-extrabold text-[#0B1220]">Enquire to order</h2>
          <p className="mb-4 text-sm text-slate-500">Leave your details and we'll confirm the current price and delivery to your city.</p>
          <EnquiryForm product={p} />
          <a href={`https://wa.me/${WHATSAPP}?text=${waText}`} target="_blank" rel="noopener noreferrer"
            className="mt-3 flex items-center justify-center gap-2 rounded-full border-[1.5px] border-green-500 py-3 text-sm font-bold text-green-600 transition hover:bg-green-50">
            <MessageCircle className="h-4 w-4" /> Order on WhatsApp
          </a>
        </aside>
      </div>
    </div>
  );
}
