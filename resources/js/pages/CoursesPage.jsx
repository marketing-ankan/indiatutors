import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchCategoriesTree, fetchCourses } from '../lib/api.js';

// "Our Courses" — ported from the live /shop page: hero banner, Browse
// Categories sidebar, and an accordion of course cards (chips · About · Key
// Highlights · Beginner/Intermediate/Advanced batches). Real data drives name,
// age, description and price; the marketing counters (batches done / ongoing /
// students / schedules) are generated deterministically per slug so they're
// stable, exactly as the live theme presents them.

function locate(tree, slug) {
  for (const root of tree) {
    if (root.slug === slug) return { node: root, root };
    for (const child of root.children || []) if (child.slug === slug) return { node: child, root };
  }
  return null;
}

// Stable per-slug pseudo-random (FNV-1a) — same course always shows the same numbers.
const seed = (str) => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const pick = (str, min, max) => min + (seed(str) % (max - min + 1));
const SCHEDULES = ['Sat–Sun · 10:00–11:00 AM IST','Tue–Thu · 4:00–5:00 PM IST','Mon–Wed–Fri · 6:00–7:00 PM IST','Sat–Sun · 5:00–6:00 PM IST','Tue–Fri · 7:00–8:00 PM IST'];
const HIGHLIGHTS = ['Small batch, personalised attention','Expert certified trainers','Structured weekly curriculum','Practice worksheets included','Certificate on completion'];
const LEVELS = ['Beginner','Intermediate','Advanced'];
const inr = n => '₹' + Math.round(n).toLocaleString('en-IN');

function CourseAccordion({ c, open, onToggle }) {
  const now = c.effective_price || c.regular_price || 0;
  const was = Math.ceil((now / 0.6) / 50) * 50;   // 40% off model, rounded up to ₹50
  const batches = pick(c.slug + 'b', 65, 200);
  const ongoing = pick(c.slug + 'o', 10, 26);
  const weeks = [8, 12][seed(c.slug + 'w') % 2];
  const rootCat = c.categories?.[0]?.name;

  return (
    <article className={`rounded-2xl bg-white ring-1 overflow-hidden ${open ? 'ring-brand-200 shadow-md' : 'ring-slate-100 shadow-sm'}`}>
      <button onClick={onToggle} className="w-full text-left px-5 py-4 flex items-start justify-between gap-4 hover:bg-slate-50">
        <div className="min-w-0">
          <h3 className="font-extrabold text-slate-900">{c.name}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-slate-100 text-slate-600 px-2.5 py-1 text-[11px] font-semibold">🔁 {batches} Batches done</span>
            <span className="rounded-full bg-slate-100 text-slate-600 px-2.5 py-1 text-[11px] font-semibold">🟢 {ongoing} Ongoing</span>
            {c.age && <span className="rounded-full bg-slate-100 text-slate-600 px-2.5 py-1 text-[11px] font-semibold">👧 {c.age}</span>}
            <span className="rounded-full bg-slate-100 text-slate-600 px-2.5 py-1 text-[11px] font-semibold">📅 {weeks} Weeks</span>
            {now > 0 && (
              <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold inline-flex items-center gap-1.5">
                <span className="font-extrabold text-brand-800">{inr(now)}</span>
                <span className="text-slate-400 line-through">{inr(was)}</span>
                <span className="text-green-700 font-bold">40% OFF</span>
                <span className="text-slate-500">/ class · 1:1</span>
              </span>
            )}
          </div>
        </div>
        <span className={`shrink-0 text-slate-400 text-lg transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-slate-100 pt-4 grid lg:grid-cols-[1fr_1fr] gap-6">
          <div>
            <h4 className="text-sm font-bold text-slate-800 mb-1.5">About This Course</h4>
            <p className="text-sm text-slate-600 leading-relaxed">{c.short_description || c.subtitle || `Live, expert-led ${c.name} classes with a structured curriculum, regular practice and personalised feedback.`}</p>
            <h4 className="text-sm font-bold text-slate-800 mt-4 mb-1.5">Key Highlights</h4>
            <ul className="space-y-1">
              {HIGHLIGHTS.map(h => <li key={h} className="text-sm text-slate-600 flex gap-2"><span className="text-green-600">✔</span>{h}</li>)}
            </ul>
          </div>
          <div>
            <div className="grid sm:grid-cols-3 gap-2.5">
              {LEVELS.map(lvl => (
                <div key={lvl} className="rounded-xl ring-1 ring-slate-100 bg-slate-50 p-3">
                  <p className="font-bold text-sm text-slate-800">{lvl}</p>
                  <p className="text-xs text-slate-500 mt-1">👥 {pick(c.slug + lvl, 10, 15)} students</p>
                  <p className="text-xs text-slate-500 mt-0.5">{SCHEDULES[seed(c.slug + lvl) % SCHEDULES.length]}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link to={`/book-demo?subject=${encodeURIComponent(c.name)}`} className="rounded-lg bg-brand-600 text-white px-4 py-2 text-sm font-bold hover:bg-brand-700">Book a Free Demo</Link>
              <Link to={`/courses/${c.slug}`} className="rounded-lg ring-1 ring-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">View Details</Link>
              {rootCat && <span className="ml-auto self-center text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{rootCat}</span>}
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

export default function CoursesPage() {
  const [params, setParams] = useSearchParams();
  const category = params.get('category') || '';
  const search   = params.get('search') || '';
  const page     = parseInt(params.get('page') || '1', 10);
  const [openSlug, setOpenSlug] = useState(null);

  const { data: categories = [] } = useQuery({ queryKey:['categories','tree'], queryFn: fetchCategoriesTree });
  const { data, isLoading } = useQuery({
    queryKey: ['courses', { category, search, page }],
    queryFn: () => fetchCourses({ category, search, page, per_page:24 }),
  });

  const setParam = (key, val) => {
    const next = new URLSearchParams(params);
    if (val) next.set(key, val); else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next);
    setOpenSlug(null);
  };

  const courses = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const located = category ? locate(categories, category) : null;
  const activeRootSlug = located?.root?.slug;
  // First card open by default (like the live page), until the user picks another.
  const effectiveOpen = openSlug ?? courses[0]?.slug;

  const CatButton = ({ c, child = false }) => (
    <button onClick={()=>setParam('category', c.slug)}
      className={`w-full text-left rounded flex justify-between items-center gap-2 ${child ? 'pl-6 pr-2 py-1 text-[13px]' : 'px-2 py-1.5 text-sm'} ${category===c.slug?'bg-brand-50 text-brand-700 font-semibold':'text-slate-700 hover:bg-slate-50'}`}>
      <span className="truncate">{c.name}</span>
      {c.course_count != null && <span className="text-xs text-slate-400 shrink-0">{c.course_count}</span>}
    </button>
  );

  return (
    <div className="bg-slate-50">
      <div className="container-wide py-8 space-y-6">
        {/* HERO */}
        <section className="rounded-3xl bg-gradient-to-br from-[#0B1220] to-brand-800 text-white p-8 sm:p-12 relative overflow-hidden">
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-[radial-gradient(circle,rgba(212,175,55,.22),transparent_70%)]"/>
          <span className="inline-block rounded-full bg-white/12 ring-1 ring-white/25 px-3.5 py-1.5 text-xs font-bold mb-4">📚 Our Courses</span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">All The Courses You Need In One Place</h1>
          <p className="mt-3 text-slate-300 max-w-2xl leading-relaxed">Live 1:1 and group classes across academics, coding, music, dance, languages and competitive exams — taught by expert tutors.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/book-demo" className="rounded-xl bg-[#D4AF37] text-[#0B1220] px-6 py-3 text-sm font-bold shadow-lg shadow-[#D4AF37]/30 hover:brightness-105">🚀 Book Now</Link>
            <Link to="/book-demo" className="rounded-xl border border-white/60 px-6 py-3 text-sm font-bold hover:bg-white/10">🎯 Book a Free Demo</Link>
          </div>
        </section>

        <div className="grid lg:grid-cols-[260px_1fr] gap-6 items-start">
          {/* SIDEBAR */}
          <aside className="rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm p-4 space-y-4 lg:sticky lg:top-24">
            <input type="search" defaultValue={search} placeholder="Search courses…"
              onKeyDown={e=>{ if(e.key==='Enter') setParam('search', e.currentTarget.value); }}
              className="w-full rounded-md ring-1 ring-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"/>
            <div>
              <h3 className="font-bold text-sm mb-2">Browse Categories</h3>
              <ul className="space-y-0.5">
                <li><button onClick={()=>setParam('category','')} className={`w-full text-left px-2 py-1.5 rounded text-sm ${!category?'bg-brand-50 text-brand-700 font-semibold':'text-slate-700 hover:bg-slate-50'}`}>All Categories</button></li>
                {categories.map(c=>(
                  <li key={c.id}>
                    <CatButton c={c} />
                    {(activeRootSlug === c.slug) && c.children?.length > 0 && (
                      <ul className="mt-0.5 space-y-0.5 border-l border-slate-100 ml-2">
                        {c.children.map(ch => <li key={ch.id}><CatButton c={ch} child /></li>)}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* ACCORDION LIST */}
          <div>
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="text-xl font-extrabold tracking-tight">{located?.node?.name || 'All Courses'}</h2>
              <span className="text-sm text-slate-500">{isLoading ? 'Loading…' : `${total} course${total===1?'':'s'}`}</span>
            </div>

            {isLoading ? (
              <div className="space-y-3">{Array.from({length:6}).map((_,i)=><div key={i} className="rounded-2xl bg-white ring-1 ring-slate-100 h-20 animate-pulse"/>)}</div>
            ) : courses.length ? (
              <>
                <div className="space-y-3">
                  {courses.map(c => (
                    <CourseAccordion key={c.id} c={c} open={effectiveOpen === c.slug}
                      onToggle={()=>setOpenSlug(effectiveOpen === c.slug ? '' : c.slug)} />
                  ))}
                </div>
                {data.meta?.last_page > 1 && (
                  <div className="mt-6 flex items-center justify-center gap-1 flex-wrap">
                    {Array.from({length:data.meta.last_page},(_,i)=>i+1).map(p=>(
                      <button key={p} onClick={()=>setParam('page',String(p))} className={`h-9 w-9 rounded-md text-sm font-semibold ${p===data.meta.current_page?'bg-brand-600 text-white':'ring-1 ring-slate-200 hover:bg-slate-50 bg-white'}`}>{p}</button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20 text-slate-500 bg-white rounded-2xl ring-1 ring-slate-100">
                No courses found.
                <button onClick={()=>setParams(new URLSearchParams())} className="ml-2 text-brand-600 font-semibold hover:underline">Clear filters</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
