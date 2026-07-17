import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Download, Printer, CheckCircle2, Baby, Clock } from 'lucide-react';
import { fetchCourses, fetchCourse, submitContact } from '../lib/api.js';

// Download Curriculum (WinQuest-approved feature): a lead-gen page — pick a
// course, leave your details, and the full level-by-level curriculum unlocks
// on-page with a print/save-as-PDF action. Leads land in contact_messages.
// The product page's "Download Full Curriculum (PDF)" links here prefilled
// (?course={slug}).

const inputCls = 'w-full rounded-xl border-[1.5px] border-[#e6e8f0] px-4 py-3 text-[0.95rem] focus:border-brand-600 focus:outline-none';

function CurriculumView({ course }) {
  return (
    <div className="mt-8 print:mt-0" id="curriculum-print">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <h2 className="font-heading text-2xl font-extrabold text-[#0B1220]">{course.name} — Full Curriculum</h2>
        <button type="button" onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700">
          <Printer className="h-4 w-4" /> Print / Save as PDF
        </button>
      </div>
      <div className="hidden print:block">
        <h1 className="text-2xl font-extrabold">{course.name} — Curriculum · Indiatutors Online</h1>
        {course.subtitle && <p className="text-sm text-slate-600">{course.subtitle}</p>}
      </div>
      <div className="space-y-4">
        {(course.curriculum ?? []).map((level, i) => (
          <div key={i} className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-100 print:ring-0 print:border print:border-slate-300">
            <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 bg-slate-50 px-5 py-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">{i + 1}</span>
              <h4 className="font-bold text-slate-900">{level.title}</h4>
              <div className="ml-auto flex items-center gap-3 text-xs text-slate-500">
                {level.age && <span className="inline-flex items-center gap-1"><Baby className="h-3.5 w-3.5" />{level.age}</span>}
                {level.duration && <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{level.duration}</span>}
              </div>
            </div>
            {level.topics?.length > 0 && (
              <ul className="grid gap-x-6 gap-y-2 p-5 sm:grid-cols-2 print:grid-cols-1">
                {level.topics.map((t, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-slate-600"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />{t}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
      <p className="mt-6 text-sm text-slate-500 print:hidden">
        The exact pace and level are personalised after your free demo class.{' '}
        <Link to={`/book-demo?course=${course.slug}`} className="font-semibold text-brand-600">Book a free demo →</Link>
      </p>
    </div>
  );
}

export default function DownloadCurriculumPage() {
  const [params] = useSearchParams();
  const { data: coursesResp } = useQuery({ queryKey: ['courses', { per_page: 200 }], queryFn: () => fetchCourses({ per_page: 200 }) });
  const all = coursesResp?.data ?? [];
  // Only courses that actually carry a published curriculum are offered.
  const [slug, setSlug] = useState(params.get('course') || '');
  const [f, setF] = useState({ name: '', email: '', phone: '' });
  const set = k => e => setF(s => ({ ...s, [k]: e.target.value }));

  const { data: course } = useQuery({ queryKey: ['course', slug], queryFn: () => fetchCourse(slug), enabled: !!slug });
  const hasCurriculum = useMemo(() => (course?.curriculum ?? []).length > 0, [course]);

  const send = useMutation({
    mutationFn: () => submitContact({
      name: f.name, email: f.email, phone: f.phone || undefined,
      subject: `Curriculum download: ${course?.name ?? slug}`,
      message: `Requested the full curriculum for "${course?.name ?? slug}" via /download-curriculum.`,
    }),
  });
  const unlocked = send.isSuccess;

  return (
    <div className="bg-[#f9f9fc]">
      {/* HERO */}
      <section className="relative overflow-hidden text-white print:hidden" style={{ background: 'linear-gradient(135deg,#0B1220,#1E40AF)' }}>
        <div aria-hidden="true" className="absolute -right-[50px] -top-[50px] h-[220px] w-[220px]" style={{ background: 'radial-gradient(circle,rgba(212,175,55,.32),transparent 70%)' }} />
        <div className="container-wide relative py-14 text-center">
          <span className="mb-3.5 inline-block rounded-full border border-white/[.22] bg-white/[.14] px-3.5 py-1.5 text-[0.82rem] font-bold">📄 Free download</span>
          <h1 className="font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">Download Curriculum</h1>
          <p className="mx-auto mt-3 max-w-2xl text-[#cbd5e1]">Pick a course and get its complete level-by-level curriculum — free. Save it as a PDF or print it for your child.</p>
        </div>
      </section>

      <div className="container-wide max-w-4xl py-12">
        {/* FORM CARD */}
        {!unlocked && (
          <div className="rounded-2xl bg-white p-6 shadow-[0_4px_24px_rgba(30,64,175,.10)] ring-1 ring-slate-100 sm:p-8 print:hidden">
            <h2 className="font-heading mb-1 text-xl font-extrabold text-[#0B1220]">Get the full curriculum</h2>
            <p className="mb-5 text-sm text-slate-500">Tell us where to reach you and the curriculum unlocks instantly below.</p>
            <form onSubmit={e => { e.preventDefault(); if (slug && hasCurriculum) send.mutate(); }} className="grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-[0.83rem] font-semibold text-slate-700">Course *</span>
                <select required value={slug} onChange={e => setSlug(e.target.value)} className={inputCls}>
                  <option value="">Choose a course…</option>
                  {all.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-[0.83rem] font-semibold text-slate-700">Your Name *</span>
                <input required value={f.name} onChange={set('name')} placeholder="e.g. Ramesh Sharma" className={inputCls} />
              </label>
              <label className="block">
                <span className="mb-1 block text-[0.83rem] font-semibold text-slate-700">Email *</span>
                <input required type="email" value={f.email} onChange={set('email')} placeholder="you@example.com" className={inputCls} />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-[0.83rem] font-semibold text-slate-700">WhatsApp / Phone</span>
                <input type="tel" value={f.phone} onChange={set('phone')} placeholder="+91 98765 43210" className={inputCls} />
              </label>
              {slug && course && !hasCurriculum && (
                <p className="text-sm text-amber-700 sm:col-span-2">This course's detailed curriculum is shared during the free demo — <Link to={`/book-demo?course=${slug}`} className="font-semibold text-brand-600 underline">book one here</Link>, or pick another course above.</p>
              )}
              <div className="sm:col-span-2">
                <button type="submit" disabled={send.isPending || !slug || !hasCurriculum}
                  className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-8 py-3.5 text-base font-extrabold tracking-wide text-white shadow-[0_10px_24px_rgba(30,64,175,.32)] transition hover:bg-[#0B1220] disabled:opacity-50">
                  <Download className="h-5 w-5" /> {send.isPending ? 'Unlocking…' : 'Get Curriculum'}
                </button>
              </div>
              {send.isError && <p className="text-sm text-red-600 sm:col-span-2">Could not submit — please check the fields and try again.</p>}
            </form>
          </div>
        )}

        {unlocked && (
          <div className="rounded-xl bg-green-50 p-4 text-sm font-semibold text-green-800 ring-1 ring-green-100 print:hidden">
            ✅ Unlocked! The full curriculum is below — use “Print / Save as PDF” to keep a copy. We've also noted your interest and can walk you through it on a free demo.
          </div>
        )}

        {unlocked && course && <CurriculumView course={course} />}
      </div>
    </div>
  );
}
