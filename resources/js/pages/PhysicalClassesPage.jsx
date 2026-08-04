import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { MapPin, BadgeCheck, GraduationCap, Home, Search, PartyPopper, ClipboardList } from 'lucide-react';
import { fetchTutors, fetchTutorFilters, createTuitionRequirement } from '../lib/api.js';
import { GRADE_BANDS } from '../data/grades.js';
import RequirementForm, { EMPTY_REQUIREMENT, cleanRequirement } from '../components/physical/RequirementForm.jsx';
import { errText } from '../components/admin/AdminUI.jsx';

// Physical Classes / Home Tuition (handwritten note #5). Location-first: a
// student enters pincode + subject + grade → home-capable tutors serving that
// pincode. If no tutor serves the exact pincode, we fall back to all home tutors
// so the visitor is never dead-ended (they can still book a demo).

const inr = n => '₹' + Number(n).toLocaleString('en-IN');

function TutorCard({ t, pincode }) {
  const servesPin = pincode && (t.pincodes || []).includes(pincode);
  return (
    <article className="flex flex-col rounded-2xl border border-[#E7E7EF] bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="flex items-start gap-3">
        <Link to={`/tutor/${t.slug}`} className="block h-14 w-14 shrink-0 overflow-hidden rounded-full bg-brand-50">
          {t.image_url ? <img src={t.image_url} alt={t.name} className="h-full w-full object-cover object-top" /> : <span className="flex h-full w-full items-center justify-center font-heading text-lg font-bold text-brand-600">{t.name[0]}</span>}
        </Link>
        <div className="min-w-0 flex-1">
          <h3 className="font-heading font-bold text-[#0B1220]"><Link to={`/tutor/${t.slug}`} className="hover:text-brand-600">{t.name}</Link>
            {t.verified && <BadgeCheck className="ml-1 inline h-4 w-4 text-green-600" aria-label="Verified" />}</h3>
          {t.tagline && <p className="line-clamp-1 text-xs text-slate-500">{t.tagline}</p>}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {(t.subjects || []).slice(0, 3).map(s => <span key={s} className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-semibold text-brand-700">{s}</span>)}
      </div>
      <div className="mt-3 space-y-1 text-xs text-slate-500">
        <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{[t.city, ...(t.localities || []).slice(0, 2)].filter(Boolean).join(' · ')}</p>
        <p className="flex items-center gap-1.5"><Home className="h-3.5 w-3.5" />{servesPin ? <span className="font-semibold text-green-700">Serves your pincode {pincode}</span> : 'Home & online'}</p>
      </div>
      <div className="mt-auto flex items-center justify-between pt-4">
        <span><span className="font-heading text-lg font-extrabold text-brand-600">{inr(t.fee_hourly)}</span><span className="text-xs text-slate-400">/hr</span></span>
        <Link to={`/book-demo?tutor=${t.slug}${pincode ? `&pincode=${pincode}` : ''}`} className="rounded-lg bg-brand-600 px-4 py-2 text-xs font-bold text-white hover:bg-brand-700">Book Home Demo</Link>
      </div>
    </article>
  );
}

export default function PhysicalClassesPage() {
  const [form, setForm] = useState({ pincode: '', subject: '', grade: '' });
  const [applied, setApplied] = useState({ pincode: '', subject: '', grade: '' });
  const { data: filters } = useQuery({ queryKey: ['tutor-filters'], queryFn: fetchTutorFilters });

  // Primary query: home tutors matching all applied filters.
  const { data: matched = [], isFetching } = useQuery({
    queryKey: ['home-tutors', applied],
    queryFn: () => fetchTutors({ home: 1, ...(applied.pincode && { pincode: applied.pincode }), ...(applied.subject && { subject: applied.subject }), ...(applied.grade && { grade: applied.grade }) }),
  });
  // Fallback: if a pincode was searched but nothing serves it, show home tutors
  // matching just subject+grade so the visitor still gets options.
  const noPinMatch = Boolean(applied.pincode) && !isFetching && matched.length === 0;
  const { data: fallback = [] } = useQuery({
    queryKey: ['home-tutors-fallback', applied.subject, applied.grade],
    queryFn: () => fetchTutors({ home: 1, ...(applied.subject && { subject: applied.subject }), ...(applied.grade && { grade: applied.grade }) }),
    enabled: noPinMatch,
  });

  const set = k => e => setForm(s => ({ ...s, [k]: e.target.value }));
  const search = e => { e.preventDefault(); setApplied({ ...form }); };
  const results = noPinMatch ? fallback : matched;

  return (
    <div className="bg-[#f9f9fc]">
      {/* HERO + SEARCH */}
      <section className="relative overflow-hidden text-white" style={{ background: 'linear-gradient(135deg,#0B1220,#1E40AF)' }}>
        <div aria-hidden="true" className="absolute -right-[50px] -top-[50px] h-[220px] w-[220px]" style={{ background: 'radial-gradient(circle,rgba(212,175,55,.32),transparent 70%)' }} />
        <div className="container-wide relative py-14">
          <span className="mb-3.5 inline-block rounded-full border border-white/[.22] bg-white/[.14] px-3.5 py-1.5 text-[0.82rem] font-bold">🏠 Home Tuition</span>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">Find a Home Tutor Near You</h1>
          <p className="mt-3 max-w-2xl text-[#cbd5e1]">Enter your pincode, subject and your child's class — we'll match verified tutors who take home classes in your area.</p>

          <form onSubmit={search} className="mt-6 grid gap-3 rounded-2xl bg-white p-4 shadow-xl sm:grid-cols-[1fr_1fr_1fr_auto]">
            <label className="block">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">Pincode</span>
              <input value={form.pincode} onChange={set('pincode')} inputMode="numeric" maxLength={6} placeholder="e.g. 700156"
                className="w-full rounded-lg border-[1.5px] border-[#e6e8f0] px-3 py-2.5 text-sm text-slate-900 focus:border-brand-600 focus:outline-none" />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">Subject</span>
              <select value={form.subject} onChange={set('subject')} className="w-full rounded-lg border-[1.5px] border-[#e6e8f0] px-3 py-2.5 text-sm text-slate-900 focus:border-brand-600 focus:outline-none">
                <option value="">Any subject</option>
                {(filters?.subjects ?? []).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">Class / Grade</span>
              <select value={form.grade} onChange={set('grade')} className="w-full rounded-lg border-[1.5px] border-[#e6e8f0] px-3 py-2.5 text-sm text-slate-900 focus:border-brand-600 focus:outline-none">
                <option value="">Any class</option>
                {GRADE_BANDS.map(b => (
                  <optgroup key={b.key} label={b.label}>
                    {b.grades.map(g => <option key={g} value={g}>{g}</option>)}
                  </optgroup>
                ))}
              </select>
            </label>
            <button type="submit" className="flex items-center justify-center gap-2 self-end rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-700">
              <Search className="h-4 w-4" /> Search
            </button>
          </form>
        </div>
      </section>

      {/* RESULTS */}
      <div className="container-wide py-10">
        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-heading text-xl font-extrabold text-[#0B1220]">
            {applied.pincode || applied.subject || applied.grade ? 'Matching home tutors' : 'Home tutors'}
          </h2>
          <span className="text-sm text-slate-500">{isFetching ? 'Searching…' : `${results.length} tutor${results.length === 1 ? '' : 's'}`}</span>
        </div>

        {noPinMatch && (
          <p className="mb-5 rounded-xl bg-amber-50 px-5 py-3 text-sm text-amber-800 ring-1 ring-amber-100">
            No tutor lists <strong>{applied.pincode}</strong> yet — here are home tutors matching your subject &amp; class. <a href="#request" className="font-semibold underline">Post your requirement</a> and we'll find one who can reach you.
          </p>
        )}

        {results.length ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {results.map(t => <TutorCard key={t.slug} t={t} pincode={applied.pincode} />)}
          </div>
        ) : !isFetching ? (
          <div className="rounded-2xl bg-white p-10 text-center ring-1 ring-slate-100">
            <GraduationCap className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 font-semibold text-slate-700">No home tutors match yet.</p>
            <p className="mt-1 text-sm text-slate-500">Tell us exactly what you need and where — we match on real distance, so you'll get a tutor who can actually keep turning up.</p>
            <a href="#request" className="mt-5 inline-flex rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-700">Post your requirement</a>
          </div>
        ) : null}
      </div>

      <RequirementSection defaults={applied} />
    </div>
  );
}

/**
 * The directory above answers "who is already listed near me". This answers the
 * commoner case — nobody listed serves that pincode yet — by capturing what the
 * family needs so a tutor can be assigned to them. It is the student half of
 * the matching data, and it works signed-out on purpose: a family looking for a
 * tutor should not have to register first.
 */
function RequirementSection({ defaults }) {
  const [form, setForm] = useState({ ...EMPTY_REQUIREMENT, pincode: defaults.pincode || '' });
  const [done, setDone] = useState(null);

  const submit = useMutation({
    mutationFn: () => createTuitionRequirement(cleanRequirement(form)),
    onSuccess: (res) => {
      setDone(res?.message || 'Requirement received — our team will call you back.');
      window.scrollTo({ top: document.getElementById('request')?.offsetTop ?? 0, behavior: 'smooth' });
    },
  });

  return (
    <section id="request" className="scroll-mt-24 py-14" style={{ background: 'linear-gradient(180deg,#F3F6FC,#eef2fb)' }}>
      <div className="container-wide max-w-3xl">
        <div className="mb-7 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-600/10 px-3.5 py-1.5 text-[0.82rem] font-bold text-brand-700">
            <ClipboardList className="h-3.5 w-3.5" /> Tell us what you need
          </span>
          <h2 className="mt-3 font-heading text-2xl font-extrabold text-[#0B1220] sm:text-3xl">Post your home-tuition requirement</h2>
          <p className="mx-auto mt-2 max-w-xl text-slate-500">
            Takes two minutes. We match on subject, class, board, your timings and how far a tutor really has to travel —
            then a coordinator calls you with the shortlist.
          </p>
        </div>

        {done ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200 sm:p-10">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
              <PartyPopper className="h-7 w-7" />
            </span>
            <h3 className="mt-4 font-heading text-2xl font-extrabold text-[#0B1220]">Got it!</h3>
            <p className="mx-auto mt-2 max-w-md leading-relaxed text-slate-600">{done}</p>
            <button onClick={() => { setDone(null); setForm({ ...EMPTY_REQUIREMENT }); }}
              className="mt-5 text-sm font-semibold text-brand-600 hover:underline">Post another requirement</button>
          </div>
        ) : (
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-7">
            <RequirementForm value={form} onChange={setForm}
              submitting={submit.isPending}
              error={submit.isError ? errText(submit.error) : null}
              onSubmit={() => submit.mutate()} />
            <p className="mt-4 text-xs text-slate-400">
              Your address is used only to find tutors who can reach you. It is never shown publicly.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
