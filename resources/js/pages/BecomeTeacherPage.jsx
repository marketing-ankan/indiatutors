import { useState } from 'react';
import { Upload, MapPin, Loader2, PartyPopper, BookOpen, CalendarDays, UserCheck, Home } from 'lucide-react';
import { api } from '../lib/api.js';
import AddressBlock, { cleanAddress } from '../components/physical/AddressBlock.jsx';
import RadiusPicker from '../components/physical/RadiusPicker.jsx';
import AvailabilityGrid from '../components/physical/AvailabilityGrid.jsx';
import OfferingsEditor from '../components/physical/OfferingsEditor.jsx';
import { Field, field, Section, Check, ChipGroup } from '../components/physical/FormBits.jsx';
import { GENDERS, LANGUAGES } from '../data/physical.js';

// Become a Teacher — the public application, in IndiaTutors colours: hero,
// "why teach" cards, stats, a testimonial, and the apply form.
//
// The form captures the full physical-tuition profile (address + travel radius,
// subjects class-by-class, weekly availability, preferences) and posts it under
// `physical`, where the server stores it in the SAME tables the teacher
// dashboard later edits. Nothing is copied on approval — the row is simply
// handed to their account — so what they typed here is what the matcher sees.

const WHY = [
  { icon: '🗓️', t: 'Flexible scheduling', d: 'Choose your own hours — teach online from anywhere in India, or at the student’s home in your city.' },
  { icon: '👨‍👩‍👧', t: 'Students come to you', d: 'We market, match and schedule. You focus on teaching, not on finding students.' },
  { icon: '💸', t: 'Monthly payouts, no hidden cuts', d: 'Fair, on-time payments straight to your account with transparent fees.' },
  { icon: '📊', t: 'Earnings dashboard & analytics', d: 'Track your classes, students, reviews and income from one simple dashboard.' },
  { icon: '🎯', t: 'Smart student matching', d: 'We match you to students by subject, board, class and — for home tuition — real travel distance.' },
  { icon: '✅', t: 'Verified badge & public profile', d: 'Build reviews and a verified public profile that attracts more students over time.' },
];

// "20+ Countries" removed 2026-08-10 — owner confirmed India-only. Replaced
// with the tutor count rather than dropped, because this grid is fixed at
// three columns and a gap would read as a rendering fault.
const STATS = [['10,000+', 'Classes delivered'], ['75+', 'Expert tutors'], ['100+', 'Subjects']];

const EMPTY_PHYSICAL = {
  nationality: 'Indian', country: 'India', at_student_home: true,
  service_radius_km: 0, preferred_student_gender: 'any',
  offerings: [], availability: [], languages: '',
};

function ApplyForm() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', video_url: '', notes: '' });
  const [physical, setPhysical] = useState(EMPTY_PHYSICAL);
  const [cv, setCv] = useState(null);
  const [terms, setTerms] = useState(false);
  const [status, setStatus] = useState({ state: 'idle' });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setPhys = (patch) => setPhysical((p) => ({ ...p, ...patch }));
  const langs = (physical.languages || '').split(',').map(s => s.trim()).filter(Boolean);

  const submit = async (e) => {
    e.preventDefault();
    if (!terms || status.state === 'submitting') return;
    setStatus({ state: 'submitting' });
    try {
      const fd = new FormData();
      fd.append('name', form.name); fd.append('email', form.email); fd.append('phone', form.phone);

      // The application's own subject list stays derived from the offerings, so
      // the staff queue and the matcher can never disagree about what someone
      // teaches.
      physical.offerings.forEach((o) => fd.append('subjects[]', o.subject));

      if (cv) fd.append('cv', cv);
      if (form.video_url) fd.append('video_url', form.video_url);
      if (form.notes) fd.append('notes', form.notes);

      // Legacy flat columns on the application row, kept in step with the profile.
      const addr = [physical.address_line1, physical.address_line2, physical.landmark].filter(Boolean).join(', ');
      if (addr) fd.append('address', addr);
      if (physical.city) fd.append('city', physical.city);
      if (physical.pincode) fd.append('pincode', physical.pincode);
      if (physical.service_radius_km > 0) fd.append('service_radius_km', String(physical.service_radius_km));
      fd.append('teaches_online', '1');

      // One JSON blob rather than nested multipart keys — deep arrays through
      // multipart arrive as strings often enough to be a real bug source.
      fd.append('physical', JSON.stringify(cleanAddress(physical)));
      fd.append('terms', '1');

      const { data } = await api.post('/teacher-applications', fd);
      setStatus({ state: 'success', message: data.message });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      const msg = err?.response?.data?.message
        || Object.values(err?.response?.data?.errors || {})[0]?.[0]
        || 'Something went wrong. Please check your details and try again.';
      setStatus({ state: 'error', message: msg });
    }
  };

  if (status.state === 'success') {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200 sm:p-10">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600"><PartyPopper className="h-7 w-7" /></span>
        <h3 className="mt-4 font-heading text-2xl font-extrabold text-[#0B1220]">Application received!</h3>
        <p className="mx-auto mt-2 max-w-md leading-relaxed text-slate-600">{status.message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-7">
      <Section icon={UserCheck} title="About you">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Full name" required>
            <input required value={form.name} onChange={set('name')} placeholder="Enter your name" className={field} />
          </Field>
          <Field label="WhatsApp / Phone" required>
            <input required value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" className={field} />
          </Field>
        </div>
        <Field className="mt-3" label="Email" required>
          <input required type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" className={field} />
        </Field>

        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Field label="Gender" hint="families often request this">
            <select className={field} value={physical.gender ?? ''} onChange={e => setPhys({ gender: e.target.value || null })}>
              <option value="">Prefer not to say</option>
              {GENDERS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          </Field>
          <Field label="Nationality">
            <input className={field} value={physical.nationality ?? 'Indian'}
              onChange={e => setPhys({ nationality: e.target.value })} />
          </Field>
          <Field label="Years of experience">
            <input type="number" min={0} max={70} className={field} placeholder="5"
              value={physical.experience_years ?? ''}
              onChange={e => setPhys({ experience_years: e.target.value === '' ? null : Number(e.target.value) })} />
          </Field>
        </div>

        <Field className="mt-3" label="Languages you can teach in" hint="the medium, not just what you speak">
          <ChipGroup options={LANGUAGES} value={langs} onChange={next => setPhys({ languages: next.join(', ') })} />
        </Field>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Upload CV" hint="PDF/DOC, max 5 MB">
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-500 hover:border-brand-400 hover:bg-brand-50/40">
              <Upload className="h-4 w-4 shrink-0" />
              <span className="truncate">{cv ? cv.name : 'Choose file…'}</span>
              <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => setCv(e.target.files?.[0] || null)} />
            </label>
          </Field>
          <Field label="3-minute intro video" hint="link">
            <input type="url" value={form.video_url} onChange={set('video_url')} placeholder="YouTube / Drive / Loom link" className={field} />
          </Field>
        </div>
      </Section>

      <Section icon={BookOpen} title="What you teach"
        description="Add each subject with the exact classes and boards you take. This is what decides which students we show you — a Class 12 lead sent to someone who teaches Maths to Class 8 wastes everyone's time.">
        <OfferingsEditor offerings={physical.offerings} onChange={offerings => setPhys({ offerings })} />
      </Section>

      <AddressBlock value={physical} onChange={setPhys}
        title="Where you're based"
        description="For home tuition we measure real distance from here. Your exact address is never shown publicly — students see your area only." />

      <Section icon={Home} title="How far will you travel?"
        description='Prefer online only? Leave the radius at "I don&apos;t travel" — you can still be matched for online classes.'>
        <RadiusPicker value={physical} onChange={setPhys} />
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <Check label="I go to the student's home" checked={physical.at_student_home}
            onChange={v => setPhys({ at_student_home: v })} />
          <Check label="Students come to me" checked={physical.at_own_place}
            onChange={v => setPhys({ at_own_place: v })} />
          <Check label="A library or study centre" checked={physical.at_public_place}
            onChange={v => setPhys({ at_public_place: v })} />
        </div>
      </Section>

      <Section icon={CalendarDays} title="When you're free"
        description="Mark the hours you could take a class. We only show you to families whose timings overlap yours.">
        <AvailabilityGrid slots={physical.availability} onChange={availability => setPhys({ availability })} />
      </Section>

      <Field label="Anything else?" hint="optional">
        <textarea rows={3} value={form.notes} onChange={set('notes')} className={field}
          placeholder="Qualifications, preferred boards, areas you know well, exam results you're proud of…" />
      </Field>

      <label className="flex items-start gap-2.5 text-sm text-slate-600">
        <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
        {/* target=_blank, not a same-tab load: this form holds the CV File, the
            availability grid and the address with no localStorage persistence,
            so navigating away destroyed a part-filled application — and Back
            cannot restore a File at all. It punished exactly the applicants who
            read the terms. */}
        <span>I agree to the <a href="/terms-conditions" target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-600 hover:underline">Terms &amp; Conditions</a> and <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-600 hover:underline">Privacy Policy</a>, and consent to being contacted about my application.</span>
      </label>

      {status.state === 'error' && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">{status.message}</p>}

      <button type="submit" disabled={!terms || status.state === 'submitting'}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">
        {status.state === 'submitting' ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</> : 'Apply Now'}
      </button>
      <p className="text-xs text-slate-400">Our team reviews every application. Your details are stored securely and never shared with third parties.</p>
    </form>
  );
}

export default function BecomeTeacherPage() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden text-white" style={{ background: 'linear-gradient(135deg,#0B1220,#1E40AF)' }}>
        <div aria-hidden="true" className="absolute -right-16 -top-16 h-64 w-64 rounded-full" style={{ background: 'radial-gradient(circle,rgba(212,175,55,.28),transparent 70%)' }} />
        <div className="relative mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
          <h1 className="font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">Become a Teacher at Indiatutors Online</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-slate-200">Share your expertise with students across India. Flexible hours, fair pay, and a platform that handles the rest — you just teach.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm font-semibold">
            {['💰 Earn on your schedule', '🌍 Online & home tuition', '🎯 We bring the students'].map((c) => (
              <span key={c} className="rounded-full bg-white/15 px-4 py-1.5 ring-1 ring-white/25">{c}</span>
            ))}
          </div>
          <a href="#apply" className="mt-7 inline-flex rounded-xl bg-[#D4AF37] px-7 py-3 text-sm font-bold text-[#0B1220] shadow-lg shadow-[#D4AF37]/30 hover:brightness-105">Apply to teach →</a>
        </div>
      </section>

      {/* WHY TEACH */}
      <section className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-9 text-center font-heading text-2xl font-extrabold text-[#0B1220] sm:text-3xl">Why teach with Indiatutors Online?</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {WHY.map((w) => (
              <div key={w.t} className="rounded-2xl p-6 shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-1 hover:shadow-lg">
                <div className="mb-3 text-3xl">{w.icon}</div>
                <h3 className="font-bold text-slate-900">{w.t}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{w.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <div className="py-10" style={{ background: '#FBF7EC' }}>
        <div className="mx-auto grid max-w-3xl grid-cols-3 gap-4 px-4 text-center">
          {STATS.map(([n, l]) => (
            <div key={l}>
              <div className="font-heading text-3xl font-extrabold text-brand-700">{n}</div>
              <div className="mt-0.5 text-xs font-semibold text-slate-500">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* TESTIMONIAL */}
      <section className="bg-white py-12">
        <figure className="mx-auto max-w-2xl px-4 text-center">
          <blockquote className="font-heading text-xl font-semibold leading-relaxed text-[#0B1220] sm:text-2xl">"I applied on a Sunday and had my first student the very next week. The scheduling and payouts just work — I only have to teach."</blockquote>
          <figcaption className="mt-4 text-sm text-slate-500">— Priya R., Mathematics Teacher · Kolkata</figcaption>
        </figure>
      </section>

      {/* APPLY */}
      <section id="apply" className="scroll-mt-24 py-14" style={{ background: 'linear-gradient(180deg,#F3F6FC,#eef2fb)' }}>
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="text-center font-heading text-2xl font-extrabold text-[#0B1220] sm:text-3xl">Apply to teach</h2>
          <p className="mx-auto mb-8 mt-2 max-w-xl text-center text-slate-500">
            Subjects class-by-class, where you'll travel, and when you're free. It takes a few minutes and it is what we
            match students against — so the more exact it is, the better the leads you get.
          </p>
          <ApplyForm />
        </div>
      </section>

      {/* A quiet nudge for teachers who only want online work — MapPin keeps the
          section legible when the radius is left at zero. */}
      <section className="bg-white py-10">
        <p className="mx-auto flex max-w-2xl items-start gap-2 px-4 text-sm text-slate-500">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
          <span>Only interested in online classes? Apply anyway and leave the travel radius at zero — online teaching is scheduled separately and doesn't depend on where you live.</span>
        </p>
      </section>
    </>
  );
}
