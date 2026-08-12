import { useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchTutors, fetchTutorFilters } from '../lib/api.js';
import ListLoadError from '../components/ListLoadError.jsx';

// Ported from the live /tutors/ page: hero with marketplace stats, a single
// horizontal filter bar (Subjects · Boards · Grades · Mode · City · Name/subject),
// and 4-up tutor cards with a dark header band + VERIFIED badge.

const BOARDS = ['CBSE','ICSE','IB','IGCSE','State Board'];
const GRADES = ['Pre-K','Kindergarten',...Array.from({length:12},(_,i)=>`Grade ${i+1}`)];
const inp = "rounded-md ring-1 ring-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500";

function LiveTutorCard({ t }) {
  const fb = `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#1e3a8a"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="Inter,sans-serif" font-size="80" fill="white">${(t.name||'?')[0]}</text></svg>`)}`;
  const subjects = Array.isArray(t.subjects) ? t.subjects : [];
  return (
    <article className="rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm overflow-hidden flex flex-col">
      <div className="bg-gradient-to-r from-brand-800 to-brand-900 text-white px-4 py-3 flex items-center gap-3">
        <img src={t.image_url || fb} alt={t.name} onError={e=>{e.currentTarget.src=fb}}
          className="w-12 h-12 rounded-full object-cover object-top ring-2 ring-white/40 shrink-0"/>
        <div className="min-w-0">
          <h3 className="font-bold truncate">{t.name}</h3>
          {t.verified && <span className="text-[11px] font-bold text-emerald-300">✓ VERIFIED</span>}
        </div>
      </div>
      <div className="p-4 flex flex-col gap-3 flex-1">
        <p className="text-sm text-slate-700 leading-snug line-clamp-2 min-h-[2.5rem]">{t.tagline}</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
          {t.city && <span>📍 {t.city}</span>}
          {t.experience_years > 0 && <span>⭐ {t.experience_years}+ yrs</span>}
          <span>💻 {t.teaching_mode === 'both' ? 'Online & Home' : t.teaching_mode === 'home' ? 'Home' : 'Online'}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {subjects.slice(0,3).map(s => <span key={s} className="rounded-full bg-slate-100 text-slate-700 px-2.5 py-1 text-[11px] font-semibold">{s}</span>)}
        </div>
        <div className="mt-auto pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
          <span className="font-extrabold text-slate-900">₹{Number(t.fee_hourly).toLocaleString('en-IN')} <span className="text-xs font-semibold text-slate-400">/ hr</span></span>
          <Link to={`/tutors/${t.slug}`} className="rounded-lg bg-brand-800 text-white px-3.5 py-2 text-xs font-bold hover:bg-brand-900">View Profile →</Link>
        </div>
      </div>
    </article>
  );
}

export default function FindTutorsPage({ subjectOverride = '' }) {
  const [params, setParams] = useSearchParams();
  // subjectOverride backs the live /subject/{slug} archive URLs; an explicit
  // ?subject= param (user changed the filter) always wins over it.
  const subject = params.get('subject') || subjectOverride;
  const mode    = params.get('mode') || '';
  const [board, setBoard]   = useState('');
  const [grade, setGrade]   = useState('');
  const [cityQ, setCityQ]   = useState(params.get('city') || '');
  const [nameQ, setNameQ]   = useState(params.get('search') || '');
  const [applied, setApplied] = useState({ city: params.get('city') || '', q: params.get('search') || '', board:'', grade:'' });

  const { data: filters } = useQuery({ queryKey:['tutor-filters'], queryFn: fetchTutorFilters });
  const { data: tutors = [], isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['tutors', { subject, mode }],
    queryFn: () => fetchTutors({ subject, mode }),
  });

  const setParam = (k,v) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k,v); else next.delete(k);
    setParams(next);
  };
  const applySearch = () => setApplied({ city: cityQ.trim(), q: nameQ.trim(), board, grade });

  // Boards/grades/city/name refine client-side over the (small) tutor list.
  const results = useMemo(() => {
    const norm = s => (s||'').toString().toLowerCase();
    return tutors.filter(t => {
      const hay = norm([t.name, t.tagline, t.qualification, (t.subjects||[]).join(' '), t.bio].join(' '));
      if (applied.city && !norm(t.city).includes(norm(applied.city))) return false;
      if (applied.q && !hay.includes(norm(applied.q))) return false;
      if (applied.board && !hay.includes(norm(applied.board))) return false;
      if (applied.grade && !hay.includes(norm(applied.grade))) return false;
      return true;
    });
  }, [tutors, applied]);

  return (
    <>
      {/* HERO — marketplace pill, count, stats row */}
      <div className="bg-gradient-to-br from-[#0B1220] to-brand-800 text-white">
        <div className="container-wide py-12">
          <span className="inline-block rounded-full bg-white/12 ring-1 ring-white/25 px-3.5 py-1.5 text-[11px] font-bold tracking-widest uppercase mb-4">🎓 Tutor Marketplace</span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">Find Tutors</h1>
          <p className="mt-3 text-slate-300 max-w-xl">Connect with expert tutors for online classes and home tuition across India. {isLoading ? '…' : results.length} tutors available.</p>
          <div className="mt-6 flex flex-wrap gap-8">
            {[[isLoading ? '…' : results.length, 'Tutors Found'], [isLoading ? '…' : results.filter(t => t.verified).length, 'Verified Profiles'], ['₹0', 'Platform Fee']].map(([n,l]) => (
              <div key={l}><div className="text-2xl font-extrabold">{n}</div><div className="text-xs text-slate-400 font-semibold">{l}</div></div>
            ))}
          </div>
        </div>
      </div>

      {/* FILTER BAR — single horizontal row like the live site */}
      <div className="bg-white border-b border-slate-100 shadow-sm">
        <div className="container-wide py-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-extrabold tracking-widest text-slate-400 uppercase mr-1">Filter:</span>
          {/* The only cue was the visual "Filter:" span above, which no screen
              reader or voice-control command can associate with these. */}
          <select aria-label="Subject" value={subject} onChange={e=>setParam('subject', e.target.value)} className={inp}>
            <option value="">All Subjects</option>
            {(filters?.subjects ?? []).map(s=><option key={s} value={s}>{s}</option>)}
          </select>
          <select aria-label="Board" value={board} onChange={e=>setBoard(e.target.value)} className={inp}>
            <option value="">All Boards</option>
            {BOARDS.map(b=><option key={b}>{b}</option>)}
          </select>
          <select aria-label="Grade" value={grade} onChange={e=>setGrade(e.target.value)} className={inp}>
            <option value="">All Grades</option>
            {GRADES.map(g=><option key={g}>{g}</option>)}
          </select>
          <select aria-label="Teaching mode" value={mode} onChange={e=>setParam('mode', e.target.value)} className={inp}>
            <option value="">Any Mode</option>
            <option value="online">Online</option>
            <option value="home">Home Tuition</option>
          </select>
          <input aria-label="City" value={cityQ} onChange={e=>setCityQ(e.target.value)} onKeyDown={e=>e.key==='Enter'&&applySearch()} placeholder="City (e.g. Kolkata)" className={inp + ' w-40'}/>
          <input aria-label="Tutor name or subject" value={nameQ} onChange={e=>setNameQ(e.target.value)} onKeyDown={e=>e.key==='Enter'&&applySearch()} placeholder="Name or subject…" className={inp + ' w-44'}/>
          <button onClick={applySearch} className="rounded-md bg-brand-700 text-white px-5 py-2 text-sm font-bold hover:bg-brand-800">Search</button>
        </div>
      </div>

      {/* RESULTS */}
      <div className="bg-slate-50">
        <div className="container-wide py-8">
          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">{Array.from({length:8}).map((_,i)=><div key={i} className="rounded-2xl bg-slate-100 h-64 animate-pulse"/>)}</div>
          ) : results.length ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">{results.map(t=><LiveTutorCard key={t.id} t={t}/>)}</div>
          ) : isError ? (
            <ListLoadError what="tutors" onRetry={refetch} retrying={isFetching} />
          ) : (
            <div className="text-center py-20 text-slate-500">No tutors match those filters. Try clearing them.</div>
          )}
        </div>
      </div>
    </>
  );
}
