import { useState } from 'react';
import { Link } from 'react-router-dom';
import gc from '../data/groupClasses.json';

// Group Classes — 1:1 rebuild of the live /group-classes/ "ito-gc" template:
// gradient hero (eyebrow pill · title · sub · gold/ghost CTAs), a sticky
// 250px "Browse Categories" filter sidebar with a demo side-card, and an
// accordion column of course cards (chips incl. price, About, Key Highlights,
// three batch-level tiles, CTA row). First card starts open, like live.

const NAVY = '#0B1220';
const SOFT = '#F4F7FE';
const LINE = '#e6e8f0';

function PriceChip({ now, was }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D4AF37] bg-white px-3 py-1.5 text-[0.8rem] font-semibold">
      <span className="inline-flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
        <span className="font-heading font-extrabold text-[#0B1220]">{now}</span>
        <span className="text-[0.9em] text-slate-400 line-through">{was}</span>
        <span className="whitespace-nowrap rounded-full bg-green-100 px-1.5 py-0.5 text-[0.7em] font-bold text-green-600">40% OFF</span>
        <span className="text-[0.8em] text-slate-500">/ class · group</span>
      </span>
    </span>
  );
}

function GroupCard({ c, open, onToggle }) {
  return (
    <article className="overflow-hidden rounded-2xl border bg-white shadow-[0_6px_18px_rgba(11,18,32,.05)] transition-shadow hover:shadow-[0_14px_36px_rgba(11,18,32,.1)]" style={{ borderColor: LINE }}>
      {/* HEAD */}
      <header onClick={onToggle} className="flex cursor-pointer items-start justify-between gap-3.5 px-5 py-5 sm:px-[22px]">
        <div>
          <h3 className="font-heading mb-3 text-xl font-extrabold">
            <Link to={`/courses/${c.slug}`} onClick={e => e.stopPropagation()} className="text-[#0B1220] hover:text-brand-600">{c.title}</Link>
          </h3>
          <div className="flex flex-wrap gap-2">
            {c.chips.map(ch => (
              <span key={ch} className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[0.8rem] font-semibold text-slate-700" style={{ background: SOFT, borderColor: LINE }}>{ch}</span>
            ))}
            <PriceChip now={c.now} was={c.was} />
          </div>
        </div>
        <button
          type="button" aria-label="Toggle details" aria-expanded={open}
          onClick={e => { e.stopPropagation(); onToggle(); }}
          className={`h-[34px] w-[34px] shrink-0 rounded-full text-base transition-transform duration-200 ${open ? 'rotate-180 bg-brand-600 text-white' : 'text-[#0B1220]'}`}
          style={open ? undefined : { background: SOFT }}
        >▾</button>
      </header>

      {/* BODY */}
      {open && (
        <div className="border-t px-5 pb-5 sm:px-[22px] sm:pb-[22px]" style={{ borderColor: LINE }}>
          <div>
            <h4 className="font-heading mb-2 mt-[18px] text-base font-extrabold text-[#0B1220]">About This Course</h4>
            <p className="text-[0.94rem] leading-[1.65] text-slate-700">{c.about}</p>
          </div>
          <div>
            <h4 className="font-heading mb-2 mt-[18px] text-base font-extrabold text-[#0B1220]">Key Highlights</h4>
            <ul className="grid gap-x-[18px] gap-y-2 min-[901px]:grid-cols-3">
              {c.hi.map(h => (
                <li key={h} className="flex gap-2 text-[0.88rem] text-slate-700"><i aria-hidden="true" className="not-italic font-extrabold text-green-600">✔</i>{h}</li>
              ))}
            </ul>
          </div>
          <div className="mt-[18px] grid gap-3 min-[901px]:grid-cols-3">
            {c.levels.map(lv => (
              <div key={lv.name} className="rounded-xl border px-4 py-3.5" style={{ background: SOFT, borderColor: LINE }}>
                <p className="font-heading mb-1.5 font-extrabold text-[#0B1220]">{lv.name}</p>
                <p className="mb-1 text-[0.85rem] font-semibold text-slate-700">{lv.students}</p>
                <p className="text-[0.82rem] text-slate-500">{lv.schedule}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <Link to="/book-demo" className="inline-block rounded-[11px] bg-brand-600 px-[22px] py-3 text-center text-[0.92rem] font-bold text-white shadow-[0_6px_16px_rgba(30,64,175,.28)] transition hover:bg-brand-800 max-[560px]:w-full">Book a Free Demo</Link>
            <Link to={`/courses/${c.slug}`} className="inline-block rounded-[11px] border-[1.5px] border-brand-600 bg-white px-[22px] py-3 text-center text-[0.92rem] font-bold text-brand-600 transition hover:bg-[#F4F7FE] max-[560px]:w-full">View Details</Link>
            <Link to="/plans" className="inline-block rounded-[11px] border-[1.5px] bg-white px-[22px] py-3 text-center text-[0.92rem] font-bold text-[#0B1220] transition hover:border-[#0B1220] max-[560px]:w-full" style={{ borderColor: LINE }}>Book Now</Link>
          </div>
        </div>
      )}
    </article>
  );
}

export default function GroupClassesPage() {
  const [cat, setCat] = useState('all');
  const [openSet, setOpenSet] = useState(() => new Set([0]));
  const toggle = i => setOpenSet(s => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n; });
  const visible = gc.cards.map((c, i) => ({ ...c, i })).filter(c => cat === 'all' || c.cat === cat);

  return (
    <div className="mx-auto max-w-[1440px] px-[clamp(16px,4vw,40px)] pb-20 pt-7 text-slate-900">
      {/* HERO */}
      <section className="relative mb-7 overflow-hidden rounded-[22px] px-[clamp(24px,5vw,56px)] py-[46px] text-white" style={{ background: `linear-gradient(135deg,${NAVY},#1E40AF)` }}>
        <div aria-hidden="true" className="absolute -right-[50px] -top-[50px] h-[220px] w-[220px]" style={{ background: 'radial-gradient(circle,rgba(212,175,55,.32),transparent 70%)' }} />
        <div className="relative max-w-[760px]">
          <span className="mb-3.5 inline-block rounded-full border border-white/[.22] bg-white/[.14] px-3.5 py-1.5 text-[0.82rem] font-bold">👥 Group Classes</span>
          <h1 className="font-heading mb-3 text-[1.9rem] font-extrabold leading-[1.08] min-[561px]:text-[2.5rem]">Learn Together, Grow Faster</h1>
          <p className="mb-[22px] text-[1.05rem] leading-relaxed text-[#cbd5e1]">Expert-led small-group sessions — structured curriculum, peer learning and friendly competition, at affordable group pricing.</p>
          <div className="flex flex-wrap gap-3">
            <Link to="/plans" className="rounded-[11px] bg-[#D4AF37] px-[22px] py-3 text-[0.92rem] font-bold text-[#0B1220] shadow-[0_8px_20px_rgba(212,175,55,.3)] transition hover:brightness-105">🚀 Book Now</Link>
            <Link to="/book-demo" className="rounded-[11px] border-[1.5px] border-white/60 px-[22px] py-3 text-[0.92rem] font-bold text-white transition hover:bg-white/[.12]">🎯 Book a Free Demo</Link>
          </div>
        </div>
      </section>

      {/* LAYOUT: sidebar + cards */}
      <div className="grid items-start gap-6 min-[901px]:grid-cols-[250px_1fr]">
        <aside className="min-[901px]:sticky min-[901px]:top-[90px]">
          <h2 className="font-heading mb-3 text-[1.05rem] font-extrabold text-[#0B1220]">Browse Categories</h2>
          <ul className="mb-[18px] flex flex-row flex-wrap gap-1 min-[901px]:flex-col">
            {gc.categories.map(ct => (
              <li key={ct.key}>
                <button type="button" onClick={() => setCat(ct.key)}
                  className={`rounded-[10px] px-3.5 py-[11px] text-left text-[0.92rem] font-semibold transition min-[901px]:w-full ${cat === ct.key ? 'bg-brand-600 text-white' : 'text-slate-700 hover:bg-[#F4F7FE]'}`}>
                  {ct.label}
                </button>
              </li>
            ))}
          </ul>
          <div className="rounded-[14px] border p-4" style={{ background: SOFT, borderColor: LINE }}>
            <p className="mb-2.5 text-[0.9rem] font-bold text-[#0B1220]">🎁 First demo class is free</p>
            <Link to="/book-demo" className="mt-2 block rounded-[11px] bg-brand-600 px-[22px] py-3 text-center text-[0.92rem] font-bold text-white shadow-[0_6px_16px_rgba(30,64,175,.28)] transition hover:bg-brand-800">Book a Free Demo</Link>
            <Link to="/plans" className="mt-2 block rounded-[11px] border-[1.5px] border-brand-600 bg-white px-[22px] py-3 text-center text-[0.92rem] font-bold text-brand-600 transition hover:bg-white/60">See Plans &amp; Pricing</Link>
          </div>
        </aside>

        <div className="flex flex-col gap-4">
          {visible.length === 0 && <p className="px-5 py-[60px] text-center text-slate-500">No group classes in this category yet.</p>}
          {visible.map(c => <GroupCard key={c.slug} c={c} open={openSet.has(c.i)} onToggle={() => toggle(c.i)} />)}
        </div>
      </div>
    </div>
  );
}
