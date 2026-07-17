import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchStoreProducts } from '../lib/api.js';
import { STORE_CATEGORIES, CATEGORY_BY_KEY } from '../data/store.js';

// Physical Instruments & Robotics-Kits store (WinQuest-adopted, catalog +
// enquiry). Category-filtered grid of product cards; each links to its detail
// page with an "Enquire to order" form. No online payment/shipping.

const inr = n => '₹' + Number(n).toLocaleString('en-IN');

function ProductCard({ p }) {
  const cat = CATEGORY_BY_KEY[p.category];
  return (
    <Link to={`/instruments/${p.slug}`} className="group flex flex-col overflow-hidden rounded-2xl border border-[#E7E7EF] bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="flex h-[150px] items-center justify-center bg-gradient-to-br from-[#F4F7FE] to-[#E8ECF7] text-5xl">
        {p.image_url ? <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" loading="lazy" /> : (cat?.icon || '🎵')}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-heading text-sm font-bold leading-snug text-[#1A1A1A] group-hover:text-brand-600">{p.name}</h3>
        {p.blurb && <p className="mt-1.5 line-clamp-2 text-[13px] leading-snug text-slate-500">{p.blurb}</p>}
        <div className="mt-auto flex items-baseline gap-2 pt-3">
          <span className="font-heading text-base font-extrabold text-brand-600">{inr(p.price)}</span>
          <span className="text-[11px] text-slate-400">indicative</span>
        </div>
      </div>
    </Link>
  );
}

export default function InstrumentsPage() {
  const { data: products = [], isLoading } = useQuery({ queryKey: ['store-products'], queryFn: fetchStoreProducts });
  const [cat, setCat] = useState('all');
  const visible = useMemo(() => cat === 'all' ? products : products.filter(p => p.category === cat), [products, cat]);
  const grouped = useMemo(() => STORE_CATEGORIES.map(c => ({ ...c, items: visible.filter(p => p.category === c.key) })).filter(c => c.items.length), [visible]);

  return (
    <div className="mx-auto max-w-[1440px] px-[clamp(16px,4vw,40px)] pb-20 pt-7 text-slate-900">
      {/* HERO */}
      <section className="relative mb-7 overflow-hidden rounded-[22px] px-[clamp(24px,5vw,56px)] py-[46px] text-white" style={{ background: 'linear-gradient(135deg,#0B1220,#1E40AF)' }}>
        <div aria-hidden="true" className="absolute -right-[50px] -top-[50px] h-[220px] w-[220px]" style={{ background: 'radial-gradient(circle,rgba(212,175,55,.32),transparent 70%)' }} />
        <div className="relative max-w-[760px]">
          <span className="mb-3.5 inline-block rounded-full border border-white/[.22] bg-white/[.14] px-3.5 py-1.5 text-[0.82rem] font-bold">🎸 Instruments &amp; Robotics Kits</span>
          <h1 className="font-heading mb-3 text-[1.9rem] font-extrabold leading-[1.08] min-[561px]:text-[2.5rem]">Order the right kit for your child</h1>
          <p className="mb-[22px] max-w-2xl text-[1.05rem] leading-relaxed text-[#cbd5e1]">Hand-picked, age-appropriate instruments and coding kits to match your child's classes. Not sure what to buy? Read our free buying guides or just enquire — we'll recommend the right one.</p>
          <div className="flex flex-wrap gap-3">
            <Link to="/buying-guide" className="rounded-[11px] bg-[#D4AF37] px-[22px] py-3 text-[0.92rem] font-bold text-[#0B1220] shadow-[0_8px_20px_rgba(212,175,55,.3)] transition hover:brightness-105">📖 Buying Guides</Link>
            <Link to="/book-demo" className="rounded-[11px] border-[1.5px] border-white/60 px-[22px] py-3 text-[0.92rem] font-bold text-white transition hover:bg-white/[.12]">🎯 Book a Free Demo</Link>
          </div>
        </div>
      </section>

      {/* CATEGORY FILTER */}
      <div className="mb-7 flex flex-wrap gap-2">
        <button type="button" onClick={() => setCat('all')}
          className={`rounded-full px-4 py-2 text-sm font-bold transition ${cat === 'all' ? 'bg-brand-600 text-white' : 'bg-[#F4F7FE] text-slate-600 hover:bg-slate-200'}`}>All</button>
        {STORE_CATEGORIES.map(c => (
          <button key={c.key} type="button" onClick={() => setCat(c.key)}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${cat === c.key ? 'bg-brand-600 text-white' : 'bg-[#F4F7FE] text-slate-600 hover:bg-slate-200'}`}>
            {c.icon} {c.name}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-64 animate-pulse rounded-2xl bg-slate-100" />)}</div>
      ) : grouped.map(c => (
        <section key={c.key} className="mb-10">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-heading text-xl font-extrabold text-[#0B1220]">{c.icon} {c.name}</h2>
            {c.guide && <Link to={`/buying-guide/${c.guide}`} className="text-sm font-bold text-brand-600 hover:text-brand-700">Buying guide →</Link>}
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {c.items.map(p => <ProductCard key={p.slug} p={p} />)}
          </div>
        </section>
      ))}

      {/* NOTE */}
      <p className="mt-4 rounded-xl bg-[#F4F7FE] px-5 py-4 text-center text-sm text-slate-500">
        Prices are indicative — enquire on any product for the current price, availability and delivery to your city.
      </p>
    </div>
  );
}
