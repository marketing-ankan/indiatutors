import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchGroupClasses, inr } from '../lib/api';
import ListLoadError from '../components/ListLoadError';

// Group Classes — 1:1 rebuild of the live /group-classes/ "ito-gc" template:
// gradient hero (eyebrow pill · title · sub · gold/ghost CTAs), a sticky
// 250px "Browse Categories" filter sidebar with a demo side-card, and an
// accordion column of course cards (chips incl. price, About, Key Highlights,
// batch-level tiles, CTA row). First card starts open, like live.
//
// The cards used to be a committed JSON file, so nothing on this page could be
// changed without a developer and a deploy. They are now courses with
// `is_group` set, edited in the Staff Console like every other course.

const NAVY = '#0B1220';
const SOFT = '#F4F7FE';
const LINE = '#e6e8f0';

// Presentation only — the category names in the database are plain text.
const CAT_ICON = {
  'it-technologies': '💻', 'mind-sports': '♟️', 'creative-skills': '🎨',
  'dance': '💃', 'languages': '🌐', 'vocal-music': '🎤',
};

// Every chip is dropped when its field is empty. The "N Batches done" and
// "N Ongoing" figures were invented and hardcoded; they now render only once
// the owner has typed a real number into the console.
function chipsFor(c) {
  return [
    c.batches_done   != null && `🔁 ${c.batches_done} Batches done`,
    c.ongoing        != null && `🟢 ${c.ongoing} Ongoing`,
    c.age_range      && `👧 ${c.age_range}`,
    c.duration_weeks != null && `📅 ${c.duration_weeks} Weeks`,
  ].filter(Boolean);
}

function PriceChip({ price, was, discount }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D4AF37] bg-white px-3 py-1.5 text-[0.8rem] font-semibold">
      <span className="inline-flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
        <span className="font-heading font-extrabold text-[#0B1220]">{inr(price)}</span>
        {/* Only a real sale price produces a strike-through and a badge. The
            badge used to read "40% OFF" on every card regardless of price. */}
        {was != null && <span className="text-[0.9em] text-slate-400 line-through">{inr(was)}</span>}
        {discount != null && (
          <span className="whitespace-nowrap rounded-full bg-green-100 px-1.5 py-0.5 text-[0.7em] font-bold text-green-600">{discount}% OFF</span>
        )}
        <span className="text-[0.8em] text-slate-500">/ class · group</span>
      </span>
    </span>
  );
}

function GroupCard({ c, open, onToggle }) {
  const chips = chipsFor(c);

  return (
    <article className="overflow-hidden rounded-2xl border bg-white shadow-[0_6px_18px_rgba(11,18,32,.05)] transition-shadow hover:shadow-[0_14px_36px_rgba(11,18,32,.1)]" style={{ borderColor: LINE }}>
      {/* HEAD */}
      <header onClick={onToggle} className="flex cursor-pointer items-start justify-between gap-3.5 px-5 py-5 sm:px-[22px]">
        <div>
          <h3 className="font-heading mb-3 text-xl font-extrabold">
            <Link to={`/courses/${c.slug}`} onClick={e => e.stopPropagation()} className="text-[#0B1220] hover:text-brand-600">{c.title}</Link>
          </h3>
          <div className="flex flex-wrap gap-2">
            {chips.map(ch => (
              <span key={ch} className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[0.8rem] font-semibold text-slate-700" style={{ background: SOFT, borderColor: LINE }}>{ch}</span>
            ))}
            <PriceChip price={c.price} was={c.compare_at} discount={c.discount_pct} />
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
          {c.about && (
            <div>
              <h4 className="font-heading mb-2 mt-[18px] text-base font-extrabold text-[#0B1220]">About This Course</h4>
              <p className="text-[0.94rem] leading-[1.65] text-slate-700">{c.about}</p>
            </div>
          )}
          {c.highlights.length > 0 && (
            <div>
              <h4 className="font-heading mb-2 mt-[18px] text-base font-extrabold text-[#0B1220]">Key Highlights</h4>
              <ul className="grid gap-x-[18px] gap-y-2 min-[901px]:grid-cols-3">
                {c.highlights.map(h => (
                  <li key={h} className="flex gap-2 text-[0.88rem] text-slate-700"><i aria-hidden="true" className="not-italic font-extrabold text-green-600">✔</i>{h}</li>
                ))}
              </ul>
            </div>
          )}
          {c.batches.length > 0 && (
            <div className="mt-[18px] grid gap-3 min-[901px]:grid-cols-3">
              {c.batches.map(b => (
                <div key={b.id} className="rounded-xl border px-4 py-3.5" style={{ background: SOFT, borderColor: LINE }}>
                  <p className="font-heading mb-1.5 font-extrabold text-[#0B1220]">{b.name}</p>
                  {/* Seats are shown only when set. The per-level "N students"
                      counts here were invented and never moved. */}
                  {b.seats != null && <p className="mb-1 text-[0.85rem] font-semibold text-slate-700">👥 {b.seats} seats</p>}
                  <p className="text-[0.82rem] text-slate-500">
                    {[b.days, b.time && `${b.time}${b.timezone ? ` ${b.timezone}` : ''}`].filter(Boolean).join(' · ')}
                  </p>
                </div>
              ))}
            </div>
          )}
          <div className="mt-5 flex flex-wrap gap-2.5">
            <Link to="/book-demo" className="inline-block rounded-[11px] bg-brand-600 px-[22px] py-3 text-center text-[0.92rem] font-bold text-white shadow-[0_6px_16px_rgba(30,64,175,.28)] transition hover:bg-brand-800 max-[560px]:w-full">Book a Free Demo</Link>
            <Link to={`/courses/${c.slug}`} className="inline-block rounded-[11px] border-[1.5px] border-brand-600 bg-white px-[22px] py-3 text-center text-[0.92rem] font-bold text-brand-600 transition hover:bg-[#F4F7FE] max-[560px]:w-full">View Details</Link>
            <Link to="/plans" className="inline-block rounded-[11px] border-[1.5px] bg-white px-[22px] py-3 text-center text-[0.92rem] font-bold text-[#0B1220] transition hover:border-[#0B1220] max-[560px]:w-full" style={{ borderColor: LINE }}>See Plans & Pricing</Link>
          </div>
        </div>
      )}
    </article>
  );
}

export default function GroupClassesPage() {
  const [cat, setCat] = useState('all');
  // null until the reader touches an accordion, so the first card can open by
  // default without an effect that fights the query.
  const [openSet, setOpenSet] = useState(null);

  const { data, isPending, isError, refetch, isFetching } = useQuery({
    queryKey: ['group-classes'],
    queryFn: fetchGroupClasses,
    staleTime: 5 * 60_000,
  });

  const cards = data?.data ?? [];
  const cats = [{ key: 'all', label: 'All Categories' },
    ...(data?.categories ?? []).map(c => ({ ...c, label: `${CAT_ICON[c.key] ?? ''} ${c.label}`.trim() }))];

  const visible = cards.filter(c => cat === 'all' || c.category_key === cat);
  const open = openSet ?? new Set(cards.length ? [cards[0].slug] : []);
  const toggle = slug => setOpenSet(() => {
    const n = new Set(open);
    n.has(slug) ? n.delete(slug) : n.add(slug);
    return n;
  });

  return (
    <div className="w-full px-[clamp(16px,4vw,40px)] pb-20 pt-7 text-slate-900">
      {/* HERO */}
      <section className="relative mb-7 overflow-hidden rounded-[22px] px-[clamp(24px,5vw,56px)] py-[46px] text-white" style={{ background: `linear-gradient(135deg,${NAVY},#1E40AF)` }}>
        <div aria-hidden="true" className="absolute -right-[50px] -top-[50px] h-[220px] w-[220px]" style={{ background: 'radial-gradient(circle,rgba(212,175,55,.32),transparent 70%)' }} />
        <div className="relative max-w-[760px]">
          <span className="mb-3.5 inline-block rounded-full border border-white/[.22] bg-white/[.14] px-3.5 py-1.5 text-[0.82rem] font-bold">👥 Group Classes</span>
          <h1 className="font-heading mb-3 text-[1.9rem] font-extrabold leading-[1.08] min-[561px]:text-[2.5rem]">Learn Together, Grow Faster</h1>
          <p className="mb-[22px] text-[1.05rem] leading-relaxed text-[#cbd5e1]">Expert-led small-group sessions — structured curriculum, peer learning and friendly competition, at affordable group pricing.</p>
          <div className="flex flex-wrap gap-3">
            {/* Gold goes on the demo, as it does in every other hero on the site
                (VideoCourses, Landing, Courses). It was on a link to the price
                list, leaving the actual conversion action as the outline button. */}
            <Link to="/book-demo" className="rounded-[11px] bg-[#D4AF37] px-[22px] py-3 text-[0.92rem] font-bold text-[#0B1220] shadow-[0_8px_20px_rgba(212,175,55,.3)] transition hover:brightness-105">🎯 Book a Free Demo</Link>
            <Link to="/plans" className="rounded-[11px] border-[1.5px] border-white/60 px-[22px] py-3 text-[0.92rem] font-bold text-white transition hover:bg-white/[.12]">See Plans & Pricing</Link>
          </div>
        </div>
      </section>

      {/* LAYOUT: sidebar + cards */}
      <div className="grid grid-cols-1 items-start gap-6 min-[901px]:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="min-[901px]:sticky min-[901px]:top-[90px]">
          <h2 className="font-heading mb-3 text-[1.05rem] font-extrabold text-[#0B1220]">Browse Categories</h2>
          <ul className="mb-[18px] flex flex-row flex-wrap gap-1 min-[901px]:flex-col">
            {cats.map(ct => (
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
          {isPending && [0, 1, 2].map(i => (
            <div key={i} className="h-[118px] animate-pulse rounded-2xl border bg-white" style={{ borderColor: LINE }} />
          ))}

          {/* A failed request said "No group classes in this category yet." here
              before — an empty state that read like an answer. */}
          {isError && <ListLoadError what="group classes" onRetry={refetch} retrying={isFetching} />}

          {!isPending && !isError && visible.length === 0 && (
            <p className="px-5 py-[60px] text-center text-slate-500">No group classes in this category yet.</p>
          )}
          {!isError && visible.map(c => <GroupCard key={c.slug} c={c} open={open.has(c.slug)} onToggle={() => toggle(c.slug)} />)}
        </div>
      </div>
    </div>
  );
}
