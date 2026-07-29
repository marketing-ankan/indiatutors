import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2 } from 'lucide-react';
import { fetchCourses, inr } from '../lib/api.js';
import {
  BOARD_BY_SLUG, ACADEMIC_CATEGORIES, ACADEMIC_PARENTS, SUBJECT_ORDER,
} from '../data/boards.js';

// Board landing page (/board/{slug}) — CBSE / ICSE / IGCSE / State Boards /
// NCERT. Surfaces the academic courses that belong to the chosen board's
// syllabus, filterable by subject chip.

// A course's subject subcategories (drop the grouping parents like "Academics").
const subjectsOf = (c) => (c.categories || []).filter((cat) => !ACADEMIC_PARENTS.has(cat.slug));
// The seeder disambiguates a subject name that appears under both academic bands
// by suffixing the parent id (english -> english-8), so rank on the base slug.
const baseSlug = (slug) => String(slug).replace(/-\d+$/, '');
const rank = (slug) => { const i = SUBJECT_ORDER.indexOf(baseSlug(slug)); return i === -1 ? 99 : i; };
// Order a course by its best (lowest-ranked) subject, then by starting grade so
// the grid reads English 1-7 → 8 → 9-10 → 11-12 (not the alphabetical 1-7, 11-12, 8…).
const subjRank = (c) => Math.min(999, ...subjectsOf(c).map((cat) => rank(cat.slug)));
const gradeOf = (name) => { const m = String(name).match(/\d+/); return m ? parseInt(m[0], 10) : 999; };

function CourseCard({ c }) {
  return (
    <Link to={`/courses/${c.slug}`} className="group flex flex-col overflow-hidden rounded-[14px] border border-[#E7E7EF] bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="h-[130px] overflow-hidden bg-[#F3F6FC]">
        {c.image_url
          ? <img src={c.image_url} alt={c.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
          : <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1E40AF] to-[#1E3A8A] font-heading text-3xl font-bold text-white/90">{c.name[0]}</span>}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-heading text-sm font-bold leading-snug text-[#1A1A1A] group-hover:text-brand-600">{c.name}</h3>
        <p className="mt-2 flex items-center gap-1.5 pt-0">
          <span className="text-[15px] font-extrabold text-brand-600">{inr(c.effective_price)}</span>
          {c.on_sale && <span className="text-[11px] text-slate-400 line-through">{inr(c.regular_price)}</span>}
        </p>
      </div>
    </Link>
  );
}

export default function BoardPage() {
  const { slug } = useParams();
  const board = BOARD_BY_SLUG[slug];
  const [subject, setSubject] = useState('');   // selected subject slug, '' = all

  const { data, isLoading } = useQuery({
    queryKey: ['courses', 'all-200'],
    queryFn: () => fetchCourses({ per_page: 200 }),
    enabled: !!board,
  });

  const all = data?.data ?? [];

  // Academic courses that belong on this board.
  const academic = useMemo(() => {
    const list = all.filter(c => (c.categories || []).some(cat => ACADEMIC_CATEGORIES.includes(cat.slug)));
    // Align the grid with the subject chips: group by subject order, then grade.
    return [...list].sort((a, b) =>
      subjRank(a) - subjRank(b) || gradeOf(a.name) - gradeOf(b.name) || a.name.localeCompare(b.name));
  }, [all]);

  // Subject chips built from the visible courses (Mathematics, Science, …).
  // A subject taught in both bands is two categories (english + english-8), so
  // group by base slug — otherwise the chip row repeats "English", "Mathematics"…
  const subjects = useMemo(() => {
    const m = new Map();
    for (const c of academic) for (const cat of subjectsOf(c)) {
      const key = baseSlug(cat.slug);
      if (!m.has(key)) m.set(key, cat.name);
    }
    return [...m.entries()].map(([slug, name]) => ({ slug, name }))
      .sort((a, b) => rank(a.slug) - rank(b.slug) || a.name.localeCompare(b.name));
  }, [academic]);

  const shown = subject
    ? academic.filter(c => subjectsOf(c).some(cat => baseSlug(cat.slug) === subject))
    : academic;

  if (!board) return (
    <div className="container-wide py-20 text-center">
      <h1 className="text-2xl font-bold">Board not found</h1>
      <Link to="/courses" className="mt-4 inline-block text-brand-600">← Browse all courses</Link>
    </div>
  );

  return (
    <div className="bg-[#f9f9fc]">
      {/* HERO */}
      <section className="relative overflow-hidden text-white" style={{ background: 'linear-gradient(135deg,#0B1220,#1E40AF)' }}>
        <div aria-hidden="true" className="absolute -right-[50px] -top-[50px] h-[220px] w-[220px]" style={{ background: 'radial-gradient(circle,rgba(212,175,55,.32),transparent 70%)' }} />
        <div className="container-wide relative py-14">
          <nav className="mb-3 text-xs text-slate-300">
            <Link to="/" className="hover:text-white">Home</Link> <span className="text-slate-500">›</span> <Link to="/courses" className="hover:text-white">Courses</Link> <span className="text-slate-500">›</span> <span className="text-white">{board.name}</span>
          </nav>
          <div className="text-5xl">{board.icon}</div>
          <h1 className="font-heading mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{board.name} Tuition</h1>
          <p className="mt-1 text-sm font-semibold uppercase tracking-wider text-[#D4AF37]">{board.full}</p>
          <p className="mt-4 max-w-2xl leading-relaxed text-[#cbd5e1]">{board.blurb}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {board.highlights.map(h => (
              <span key={h} className="inline-flex items-center gap-1.5 rounded-full border border-white/[.18] bg-white/[.12] px-3 py-1 text-[0.82rem] font-medium text-white/90"><CheckCircle2 className="h-3.5 w-3.5 text-green-300" />{h}</span>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to={`/book-demo?board=${encodeURIComponent(board.name)}`} className="rounded-[11px] bg-[#D4AF37] px-[22px] py-3 text-[0.92rem] font-bold text-[#0B1220] shadow-[0_8px_20px_rgba(212,175,55,.3)] transition hover:brightness-105">🎯 Book a Free Demo</Link>
            <Link to="/find-tutors" className="rounded-[11px] border-[1.5px] border-white/60 px-[22px] py-3 text-[0.92rem] font-bold text-white transition hover:bg-white/[.12]">Find a Tutor</Link>
          </div>
        </div>
      </section>

      {/* ACADEMIC COURSES */}
      <div className="container-wide py-12">
        <h2 className="font-heading mb-1 text-2xl font-extrabold text-[#0B1220]">Subjects for {board.name}</h2>
        <p className="mb-6 text-slate-500">Live 1-on-1 tuition, taught to the {board.name} syllabus and exam pattern. Pick a subject, or browse them all — every plan starts with a free demo.</p>

        {/* SUBJECT CHIPS */}
        {!isLoading && subjects.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2">
            <button onClick={() => setSubject('')}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold ring-1 transition ${subject === '' ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white text-brand-700 ring-slate-200 hover:ring-brand-400'}`}>
              All subjects
            </button>
            {subjects.map(s => (
              <button key={s.slug} onClick={() => setSubject(s.slug)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold ring-1 transition ${subject === s.slug ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white text-brand-700 ring-slate-200 hover:ring-brand-400'}`}>
                {s.name}
              </button>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-56 animate-pulse rounded-[14px] bg-slate-100" />)}</div>
        ) : shown.length ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {shown.map(c => <CourseCard key={c.slug} c={c} />)}
          </div>
        ) : (
          <p className="rounded-xl bg-white p-6 text-center text-slate-500 ring-1 ring-slate-100">Tell us your class and subject and we'll match a {board.name} tutor — <Link to={`/book-demo?board=${encodeURIComponent(board.name)}`} className="font-semibold text-brand-600">book a free demo</Link>.</p>
        )}

        {/* CTA */}
        <div className="mt-12 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 px-6 py-10 text-center text-white">
          <h2 className="font-heading text-2xl font-extrabold">Studying a different subject or class?</h2>
          <p className="mt-1 text-white/90">We cover every subject across {board.name}. Tell us what you need and we'll match the right tutor.</p>
          <Link to={`/book-demo?board=${encodeURIComponent(board.name)}`} className="mt-5 inline-flex rounded-lg bg-white px-6 py-2.5 text-sm font-bold text-brand-700 hover:bg-slate-100">Book a Free Demo</Link>
        </div>
      </div>
    </div>
  );
}
