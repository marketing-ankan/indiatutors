import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search, MapPin } from 'lucide-react';
import { fetchTutors, fetchTutorFilters, fetchCities } from '../lib/api.js';
import TutorCard from '../components/TutorCard.jsx';

export default function FindTutorsPage() {
  const [params, setParams] = useSearchParams();
  const subject = params.get('subject') || '';
  const city    = params.get('city') || '';
  const mode    = params.get('mode') || '';
  const search  = params.get('search') || '';
  const sort    = params.get('sort') || 'default';

  const { data: filters } = useQuery({ queryKey:['tutor-filters'], queryFn: fetchTutorFilters });
  const { data: cities = [] } = useQuery({ queryKey:['cities'], queryFn: fetchCities });
  const { data: tutors = [], isLoading } = useQuery({
    queryKey: ['tutors', { subject, city, mode, search, sort }],
    queryFn: () => fetchTutors({ subject, city, mode, search, sort }),
  });

  const setParam = (k,v) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k,v); else next.delete(k);
    setParams(next);
  };

  const inp = "w-full rounded-md ring-1 ring-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500";

  return (
    <>
      <div className="bg-brand-900 text-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-300 mb-2">Verified Educators</p>
          <h1 className="text-4xl font-extrabold tracking-tight">Find Your Perfect Tutor</h1>
          <p className="mt-3 text-slate-300 max-w-2xl">Every tutor is verified and qualification-checked. Browse by subject, city, or mode — then book a free trial class.</p>
        </div>
      </div>

      {cities.length > 0 && (
        <div className="border-b border-slate-100 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold text-slate-500 inline-flex items-center gap-1"><MapPin className="h-4 w-4"/>Tutors by city:</span>
            {cities.map(c => (
              <Link key={c.slug} to={`/tutors-in/${c.slug}`} className="rounded-full bg-slate-100 hover:bg-brand-50 hover:text-brand-700 px-3 py-1 text-sm font-medium text-slate-700">
                {c.name} <span className="text-slate-400">({c.tutor_count})</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 grid lg:grid-cols-[260px_1fr] gap-8">
        {/* FILTERS */}
        <aside className="space-y-5">
          <div className="relative">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"/>
            <input type="search" defaultValue={search} placeholder="Search tutors…"
              onKeyDown={e=>{ if(e.key==='Enter') setParam('search', e.currentTarget.value); }}
              className={inp + ' pl-9'}/>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-2">Subject</h3>
            <select value={subject} onChange={e=>setParam('subject', e.target.value)} className={inp}>
              <option value="">All subjects</option>
              {(filters?.subjects ?? []).map(s=><option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-2">City</h3>
            <select value={city} onChange={e=>setParam('city', e.target.value)} className={inp}>
              <option value="">All cities</option>
              {(filters?.cities ?? []).map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-2">Mode</h3>
            <select value={mode} onChange={e=>setParam('mode', e.target.value)} className={inp}>
              <option value="">Online & Home</option>
              <option value="online">Online only</option>
              <option value="home">Home tutor</option>
            </select>
          </div>

          {(subject||city||mode||search) && (
            <button onClick={()=>setParams(new URLSearchParams())} className="text-sm text-brand-600 font-semibold hover:text-brand-700">Clear all filters</button>
          )}
        </aside>

        {/* RESULTS */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-slate-500">{isLoading?'Loading…':`${tutors.length} tutor${tutors.length===1?'':'s'} found`}</div>
            <select value={sort} onChange={e=>setParam('sort',e.target.value)} className="rounded-md ring-1 ring-slate-200 px-3 py-2 text-sm focus:outline-none">
              <option value="default">Recommended</option>
              <option value="fee_asc">Fee: Low to High</option>
              <option value="fee_desc">Fee: High to Low</option>
              <option value="name">Name A–Z</option>
            </select>
          </div>

          {isLoading ? (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">{Array.from({length:6}).map((_,i)=><div key={i} className="rounded-2xl bg-slate-100 h-80 animate-pulse"/>)}</div>
          ) : tutors.length ? (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">{tutors.map(t=><TutorCard key={t.id} tutor={t}/>)}</div>
          ) : (
            <div className="text-center py-20 text-slate-500">No tutors match those filters. Try clearing them.</div>
          )}
        </div>
      </div>
    </>
  );
}
