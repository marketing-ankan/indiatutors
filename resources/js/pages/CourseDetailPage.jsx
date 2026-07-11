import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Video, Users, Calendar, Clock, Baby, Star } from 'lucide-react';
import { fetchCourse, inr } from '../lib/api.js';

// Course detail — ported from the live /product/{slug} layout: dark breadcrumb
// hero, title + subtitle + age + tag pills, a tab bar (About / Why Choose /
// Overview / What You'll Learn / Curriculum / Requirements / Reviews) and a
// sticky enrol card. Overview + curriculum come from the course's own data;
// the generic tabs use original boilerplate.

const TABS = ['About Indiatutors Online','Why Choose','Overview',"What You'll Learn",'Curriculum','Requirements','Reviews'];

const REVIEWS = [
  { n:'Priya S.', r:5, t:'Structured, patient teaching — my daughter looks forward to every class.' },
  { n:'Arjun M.', r:5, t:'The tutor tailored the pace to me and the progress tracker keeps me on track.' },
  { n:'Lakshmi K.', r:5, t:'Flexible scheduling and a free first demo made it easy to start. Highly recommend.' },
];

export default function CourseDetailPage() {
  const { slug } = useParams();
  const [tab, setTab] = useState(0);
  const { data: course, isLoading, isError } = useQuery({ queryKey:['course',slug], queryFn:()=>fetchCourse(slug) });

  if (isLoading) return <div className="container-wide py-20 text-slate-500">Loading course…</div>;
  if (isError || !course) return <div className="container-wide py-20 text-center"><h1 className="text-2xl font-bold">Course not found</h1><Link to="/courses" className="text-brand-600 mt-4 inline-block">← Back to courses</Link></div>;

  const curriculum = course.curriculum ?? [];
  const learn = curriculum.flatMap(l => l.topics || []).slice(0, 8);
  const tabLabel = i => i === 1 ? `Why Choose Online ${course.name} Classes` : TABS[i];

  return (
    <div className="bg-slate-50">
      {/* BREADCRUMB HERO */}
      <section className="relative bg-gradient-to-br from-[#0B1220] to-brand-900 text-white text-center py-16 overflow-hidden">
        {course.image_url && <img src={course.image_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20"/>}
        <div className="relative container-wide">
          <nav className="text-xs text-slate-300 mb-3">
            <Link to="/" className="hover:text-white">Home</Link> <span className="text-slate-500">›</span> <Link to="/courses" className="hover:text-white">Courses</Link> <span className="text-slate-500">›</span> <span className="text-white">{course.name}</span>
          </nav>
          <p className="text-xs font-bold tracking-[0.2em] text-[#D4AF37] uppercase mb-2">Course Details</p>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">{course.name}</h1>
          <div className="mx-auto mt-4 h-1 w-16 rounded bg-[#D4AF37]"/>
        </div>
      </section>

      <div className="container-wide py-10 grid lg:grid-cols-[1fr_360px] gap-8 items-start">
        {/* MAIN */}
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">{course.name}</h2>
          {course.subtitle && <p className="mt-1 text-slate-600">{course.subtitle}</p>}
          {course.short_description && !course.subtitle && <p className="mt-1 text-slate-600">{course.short_description}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {course.age && <span className="text-sm text-slate-500 inline-flex items-center gap-1"><Baby className="h-4 w-4 text-brand-600"/>{course.age}</span>}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {course.categories?.map(c => <Link key={c.id} to={`/courses?category=${c.slug}`} className="rounded-full bg-green-50 text-green-700 px-3 py-1 text-xs font-semibold hover:bg-green-100">{c.name}</Link>)}
            <span className="rounded-full bg-red-50 text-red-600 px-3 py-1 text-xs font-bold">Live</span>
          </div>

          {/* TABS */}
          <div className="mt-6 border-b border-slate-200 flex flex-wrap gap-x-5 gap-y-1 overflow-x-auto">
            {TABS.map((_, i) => (
              <button key={i} onClick={()=>setTab(i)} className={`whitespace-nowrap py-2.5 text-sm font-semibold border-b-2 -mb-px ${tab===i?'border-brand-600 text-brand-700':'border-transparent text-slate-500 hover:text-slate-700'}`}>{tabLabel(i)}</button>
            ))}
          </div>

          <div className="mt-6 text-slate-700 leading-relaxed space-y-4">
            {tab === 0 && (
              <>
                <h3 className="text-lg font-bold text-slate-900">About Indiatutors Online</h3>
                <p>Indiatutors Online is a live tutoring marketplace connecting students with verified, expert educators across 100+ subjects. Every class is live and interactive, with a personalised curriculum, regular practice and a progress tracker after each session — and your first demo class is always free.</p>
              </>
            )}
            {tab === 1 && (
              <>
                <h3 className="text-lg font-bold text-slate-900">Why Choose Online {course.name} Classes</h3>
                <ul className="space-y-2">
                  {['Learn from a background-verified, subject-expert tutor','Personalised curriculum built around your goals and pace','Small batches or 1-on-1 — your choice','Flexible scheduling across time zones, reschedule anytime','Progress tracked and shared after every class'].map(x => <li key={x} className="flex gap-2"><CheckCircle2 className="h-4 w-4 mt-1 text-green-500 shrink-0"/>{x}</li>)}
                </ul>
              </>
            )}
            {tab === 2 && (
              course.description
                ? <div className="prose prose-slate max-w-none" dangerouslySetInnerHTML={{__html: course.description}}/>
                : <p>{course.short_description || course.subtitle || `Live, expert-led ${course.name} classes with a structured curriculum, regular practice and personalised feedback.`}</p>
            )}
            {tab === 3 && (
              learn.length ? (
                <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
                  {learn.map((t,i) => <li key={i} className="flex gap-2"><CheckCircle2 className="h-4 w-4 mt-1 text-green-500 shrink-0"/>{t}</li>)}
                </ul>
              ) : <p>A structured, level-by-level path covering fundamentals to advanced topics — tailored further after your free demo.</p>
            )}
            {tab === 4 && (
              curriculum.length ? (
                <div className="space-y-4">
                  {curriculum.map((level, i) => (
                    <div key={i} className="rounded-2xl ring-1 ring-slate-100 bg-white overflow-hidden">
                      <div className="flex flex-wrap items-center gap-3 bg-slate-50 px-5 py-3 border-b border-slate-100">
                        <span className="w-7 h-7 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold shrink-0">{i+1}</span>
                        <h4 className="font-bold text-slate-900">{level.title}</h4>
                        <div className="ml-auto flex items-center gap-3 text-xs text-slate-500">
                          {level.age && <span className="inline-flex items-center gap-1"><Baby className="h-3.5 w-3.5"/>{level.age}</span>}
                          {level.duration && <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5"/>{level.duration}</span>}
                        </div>
                      </div>
                      {level.topics?.length > 0 && (
                        <ul className="p-5 grid sm:grid-cols-2 gap-x-6 gap-y-2">
                          {level.topics.map((t, j) => <li key={j} className="flex gap-2 items-start text-sm text-slate-600"><CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 shrink-0"/>{t}</li>)}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              ) : <p>A structured, level-by-level curriculum — personalised further after your free demo class.</p>
            )}
            {tab === 5 && (
              <ul className="space-y-2">
                {['A laptop, tablet or desktop with a stable internet connection','A quiet space for the live class','Enthusiasm to learn — no prior experience needed for beginner levels','Any subject-specific materials will be shared by your tutor'].map(x => <li key={x} className="flex gap-2"><CheckCircle2 className="h-4 w-4 mt-1 text-green-500 shrink-0"/>{x}</li>)}
              </ul>
            )}
            {tab === 6 && (
              <div className="grid sm:grid-cols-3 gap-4">
                {REVIEWS.map(rv => (
                  <div key={rv.n} className="rounded-2xl bg-white ring-1 ring-slate-100 p-5">
                    <div className="flex mb-2">{[...Array(rv.r)].map((_,i)=><Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400"/>)}</div>
                    <p className="text-sm text-slate-600 italic">"{rv.t}"</p>
                    <p className="mt-3 text-sm font-bold text-slate-900">{rv.n}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ENROL CARD */}
        <aside className="rounded-2xl bg-white shadow-lg ring-1 ring-slate-100 overflow-hidden lg:sticky lg:top-24">
          {course.image_url && <div className="aspect-video bg-slate-100"><img src={course.image_url} alt={course.name} className="w-full h-full object-cover"/></div>}
          <div className="p-5 space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold">{inr(course.effective_price)}</span>
              {course.on_sale && <span className="text-base text-slate-400 line-through">{inr(course.regular_price)}</span>}
              <span className="text-xs text-slate-500 ml-auto">/ month*</span>
            </div>
            <Link to={`/book-demo?course=${course.slug}`} className="block text-center rounded-lg bg-brand-600 text-white py-2.5 text-sm font-bold hover:bg-brand-700">Book a Free Demo</Link>
            <Link to="/plans" className="block text-center rounded-lg bg-slate-100 text-slate-800 py-2.5 text-sm font-bold hover:bg-slate-200">See Plans & Pricing</Link>
            <ul className="pt-2 space-y-2 text-sm">
              {[[Video,'Live 1-on-1 online classes'],[Users,'Personalised curriculum after demo'],[Calendar,'Flexible scheduling, reschedule anytime'],[CheckCircle2,'KYC-verified tutors']].map(([Icon,t])=>(
                <li key={t} className="flex gap-2 items-start"><Icon className="h-4 w-4 mt-0.5 text-brand-600 shrink-0"/>{t}</li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
