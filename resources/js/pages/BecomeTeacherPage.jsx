import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Upload, MapPin, Globe, Loader2, PartyPopper } from 'lucide-react';
import { api, fetchCategoriesTree } from '../lib/api.js';

// Become a Teacher — WinQuest-style application flow in IndiaTutors colours:
// hero, "why teach" cards, stats, a testimonial, and a full inline apply form
// (subjects, CV, intro video, home-tuition address + service radius, weekly
// availability). Submits to POST /api/teacher-applications. The radius MATCHING
// logic (backend) comes later — this captures the address + radius the teacher
// is willing to travel.

const WHY = [
  { icon: '🗓️', t: 'Flexible scheduling', d: 'Choose your own hours and time zones — teach online or at home, from anywhere.' },
  { icon: '👨‍👩‍👧', t: 'Students come to you', d: 'We market, match and schedule. You focus on teaching, not on finding students.' },
  { icon: '💸', t: 'Monthly payouts, no hidden cuts', d: 'Fair, on-time payments straight to your account with transparent fees.' },
  { icon: '📊', t: 'Earnings dashboard & analytics', d: 'Track your classes, students, reviews and income from one simple dashboard.' },
  { icon: '🎯', t: 'Smart student matching', d: 'We match you to students by subject, board, grade and — for home tuition — location.' },
  { icon: '✅', t: 'Verified badge & public profile', d: 'Build reviews and a verified public profile that attracts more students over time.' },
];

const STATS = [['10,000+', 'Classes delivered'], ['20+', 'Countries'], ['100+', 'Subjects']];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21]; // 7 AM – 9 PM
const fmtHour = (h) => { const ap = h < 12 ? 'AM' : 'PM'; const hr = h % 12 === 0 ? 12 : h % 12; return `${hr} ${ap}`; };

const MAX_RADIUS_KM = 30;   // 0 on the slider = "Online only"

const field = 'w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500';
const labelCls = 'block text-sm font-semibold text-slate-800 mb-1.5';

function SubjectPicker({ selected, onToggle }) {
  const { data: cats = [], isLoading } = useQuery({ queryKey: ['categories', 'tree'], queryFn: fetchCategoriesTree });
  return (
    <div>
      <label className={labelCls}>Applying for <span className="text-slate-400 font-normal">· pick every subject you teach</span></label>
      <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-300 p-3 space-y-3">
        {isLoading ? <p className="text-sm text-slate-400">Loading subjects…</p> : cats.map((c) => (
          <div key={c.id}>
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-1.5">{c.name}</p>
            <div className="flex flex-wrap gap-1.5">
              {(c.children?.length ? c.children : [c]).map((s) => {
                const on = selected.includes(s.name);
                return (
                  <button key={s.id} type="button" onClick={() => onToggle(s.name)}
                    className={`rounded-full px-3 py-1 text-[13px] font-medium ring-1 transition ${on ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white text-slate-700 ring-slate-200 hover:ring-brand-400'}`}>
                    {on ? '✓ ' : ''}{s.name}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-1.5 text-xs text-slate-500">{selected.length} selected</p>
    </div>
  );
}

// A simple, maps-free radius visual: a pin with a circle that scales with the
// chosen km (or a globe when online-only). Purely illustrative for now.
function RadiusVisual({ km }) {
  if (km == null) return (
    <div className="flex flex-col items-center justify-center rounded-xl bg-brand-50 ring-1 ring-brand-100 py-6 px-4 text-center">
      <Globe className="h-9 w-9 text-brand-600" />
      <p className="mt-2 text-sm font-semibold text-brand-800">Online only</p>
      <p className="text-xs text-slate-500">You'll be matched with students for online classes.</p>
    </div>
  );
  const r = 18 + (km / 30) * 44;   // 1km → ~19, 30km → 62
  return (
    <div className="flex flex-col items-center justify-center rounded-xl bg-brand-50 ring-1 ring-brand-100 py-4 px-4 text-center">
      <svg viewBox="0 0 160 140" className="h-28 w-auto" aria-hidden="true">
        <circle cx="80" cy="78" r={r} fill="rgba(30,64,175,.12)" stroke="rgba(30,64,175,.4)" strokeDasharray="4 3" />
        <circle cx="80" cy="78" r="3" fill="#1E40AF" />
        <path d="M80 40c-9 0-16 7-16 16 0 12 16 26 16 26s16-14 16-26c0-9-7-16-16-16z" fill="#1E40AF" />
        <circle cx="80" cy="56" r="5.5" fill="#fff" />
      </svg>
      <p className="mt-1 text-sm font-semibold text-brand-800">Home tuition within {km} km</p>
      <p className="text-xs text-slate-500">We'll match students within {km} km of your address.</p>
    </div>
  );
}

function ApplyForm() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', video_url: '', address: '', city: '', pincode: '', notes: '' });
  const [subjects, setSubjects] = useState([]);
  const [radiusKm, setRadiusKm] = useState(0);     // 0 = Online only
  const [cv, setCv] = useState(null);
  const [avail, setAvail] = useState({});          // { Mon: [9,10], … }
  const [terms, setTerms] = useState(false);
  const [status, setStatus] = useState({ state: 'idle' });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const toggleSubject = (name) => setSubjects((s) => (s.includes(name) ? s.filter((x) => x !== name) : [...s, name]));
  const slotOn = (day, h) => (avail[day] || []).includes(h);
  const toggleSlot = (day, h) => setAvail((a) => {
    const cur = new Set(a[day] || []);
    cur.has(h) ? cur.delete(h) : cur.add(h);
    return { ...a, [day]: [...cur].sort((x, y) => x - y) };
  });

  const submit = async (e) => {
    e.preventDefault();
    if (!terms || status.state === 'submitting') return;
    setStatus({ state: 'submitting' });
    try {
      const fd = new FormData();
      fd.append('name', form.name); fd.append('email', form.email); fd.append('phone', form.phone);
      subjects.forEach((s) => fd.append('subjects[]', s));
      if (cv) fd.append('cv', cv);
      if (form.video_url) fd.append('video_url', form.video_url);
      if (form.address) fd.append('address', form.address);
      if (form.city) fd.append('city', form.city);
      if (form.pincode) fd.append('pincode', form.pincode);
      if (radiusKm > 0) fd.append('service_radius_km', String(radiusKm));
      fd.append('teaches_online', '1');
      Object.entries(avail).forEach(([day, hours]) => hours.forEach((h) => fd.append(`availability[${day}][]`, String(h))));
      if (form.notes) fd.append('notes', form.notes);
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
      <div className="rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm p-8 sm:p-10 text-center">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600"><PartyPopper className="h-7 w-7" /></span>
        <h3 className="mt-4 font-heading text-2xl font-extrabold text-[#0B1220]">Application received!</h3>
        <p className="mt-2 text-slate-600 leading-relaxed max-w-md mx-auto">{status.message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Full name <span className="text-red-500">*</span></label>
          <input required value={form.name} onChange={set('name')} placeholder="Enter your name" className={field} />
        </div>
        <div>
          <label className={labelCls}>WhatsApp / Phone <span className="text-red-500">*</span></label>
          <input required value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" className={field} />
        </div>
      </div>
      <div>
        <label className={labelCls}>Email <span className="text-red-500">*</span></label>
        <input required type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" className={field} />
      </div>

      <SubjectPicker selected={subjects} onToggle={toggleSubject} />

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Upload CV <span className="text-slate-400 font-normal">· PDF/DOC, max 5 MB</span></label>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3.5 py-2.5 text-sm text-slate-500 hover:border-brand-400 hover:bg-brand-50/40">
            <Upload className="h-4 w-4 shrink-0" />
            <span className="truncate">{cv ? cv.name : 'Choose file…'}</span>
            <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => setCv(e.target.files?.[0] || null)} />
          </label>
        </div>
        <div>
          <label className={labelCls}>3-minute intro video <span className="text-slate-400 font-normal">· link</span></label>
          <input type="url" value={form.video_url} onChange={set('video_url')} placeholder="YouTube / Drive / Loom link" className={field} />
        </div>
      </div>

      {/* HOME-TUITION ADDRESS + SERVICE RADIUS */}
      <div className="rounded-xl bg-slate-50 ring-1 ring-slate-100 p-5">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="h-4 w-4 text-brand-600" />
          <h4 className="font-bold text-slate-800">Home tuition — address &amp; travel radius</h4>
        </div>
        <p className="text-xs text-slate-500 mb-4">For in-person / home tuition, tell us where you're based and how far you'll travel. Prefer online only? Just pick "Online only". <span className="text-slate-400">(Your exact address is never shown publicly.)</span></p>
        <div className="grid lg:grid-cols-[1fr_auto] gap-5 items-start">
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Address</label>
              <textarea rows={2} value={form.address} onChange={set('address')} placeholder="House / street / area" className={field} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>City</label>
                <input value={form.city} onChange={set('city')} placeholder="e.g. Kolkata" className={field} />
              </div>
              <div>
                <label className={labelCls}>Pincode</label>
                <input value={form.pincode} onChange={set('pincode')} inputMode="numeric" maxLength={6} placeholder="700156" className={field} />
              </div>
            </div>
            <div>
              <label className={labelCls}>How far will you travel?</label>
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3.5">
                <div className="mb-2 flex items-baseline justify-between">
                  <span className="text-sm text-slate-500">Service radius</span>
                  <span className="text-base font-bold text-brand-700">{radiusKm === 0 ? 'Online only' : `${radiusKm} km`}</span>
                </div>
                <input type="range" min={0} max={MAX_RADIUS_KM} step={1} value={radiusKm}
                  onChange={(e) => setRadiusKm(Number(e.target.value))}
                  className="w-full cursor-pointer accent-brand-600" aria-label="Service radius in km" />
                <div className="mt-1 flex justify-between text-[11px] text-slate-400">
                  <span>Online</span><span>{MAX_RADIUS_KM / 2} km</span><span>{MAX_RADIUS_KM} km</span>
                </div>
              </div>
            </div>
          </div>
          <div className="lg:w-56"><RadiusVisual km={radiusKm === 0 ? null : radiusKm} /></div>
        </div>
      </div>

      {/* WEEKLY AVAILABILITY */}
      <div>
        <label className={labelCls}>Weekly availability <span className="text-slate-400 font-normal">· tap the hours you're free</span></label>
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <div className="min-w-[520px]">
            <div className="grid" style={{ gridTemplateColumns: `64px repeat(${DAYS.length}, 1fr)` }}>
              <div className="bg-slate-50 border-b border-slate-200" />
              {DAYS.map((d) => <div key={d} className="bg-slate-50 border-b border-l border-slate-200 py-1.5 text-center text-[11px] font-bold text-slate-500">{d}</div>)}
              {HOURS.map((h) => (
                <div key={h} className="contents">
                  <div className="border-b border-slate-100 py-1 pr-2 text-right text-[11px] font-medium text-slate-400">{fmtHour(h)}</div>
                  {DAYS.map((d) => (
                    <button key={d + h} type="button" onClick={() => toggleSlot(d, h)}
                      className={`border-b border-l border-slate-100 h-7 transition ${slotOn(d, h) ? 'bg-brand-500' : 'bg-white hover:bg-brand-50'}`}
                      aria-label={`${d} ${fmtHour(h)}`} aria-pressed={slotOn(d, h)} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div>
        <label className={labelCls}>Anything else? <span className="text-slate-400 font-normal">· optional</span></label>
        <textarea rows={3} value={form.notes} onChange={set('notes')} placeholder="Experience, qualifications, preferred boards, languages you teach in…" className={field} />
      </div>

      <label className="flex items-start gap-2.5 text-sm text-slate-600">
        <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
        <span>I agree to the <a href="/terms" className="font-semibold text-brand-600 hover:underline">Terms &amp; Privacy Policy</a>, and consent to being contacted about my application.</span>
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
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 py-16 text-center">
          <h1 className="font-heading text-4xl sm:text-5xl font-extrabold tracking-tight">Become a Teacher at Indiatutors Online</h1>
          <p className="mt-4 text-lg text-slate-200 leading-relaxed max-w-2xl mx-auto">Share your expertise with students across India and worldwide. Flexible hours, fair pay, and a platform that handles the rest — you just teach.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm font-semibold">
            {['💰 Earn on your schedule', '🌍 Online & home tuition', '🎯 We bring the students'].map((c) => (
              <span key={c} className="rounded-full bg-white/15 ring-1 ring-white/25 px-4 py-1.5">{c}</span>
            ))}
          </div>
          <a href="#apply" className="mt-7 inline-flex rounded-xl bg-[#D4AF37] px-7 py-3 text-sm font-bold text-[#0B1220] shadow-lg shadow-[#D4AF37]/30 hover:brightness-105">Apply to teach →</a>
        </div>
      </section>

      {/* WHY TEACH */}
      <section className="py-14 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-center mb-9 text-[#0B1220]">Why teach with Indiatutors Online?</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {WHY.map((w) => (
              <div key={w.t} className="rounded-2xl ring-1 ring-slate-100 shadow-sm p-6 transition hover:-translate-y-1 hover:shadow-lg">
                <div className="text-3xl mb-3">{w.icon}</div>
                <h3 className="font-bold text-slate-900">{w.t}</h3>
                <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{w.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <div className="py-10" style={{ background: '#FBF7EC' }}>
        <div className="mx-auto max-w-3xl px-4 grid grid-cols-3 gap-4 text-center">
          {STATS.map(([n, l]) => (
            <div key={l}>
              <div className="font-heading text-3xl font-extrabold text-brand-700">{n}</div>
              <div className="text-xs font-semibold text-slate-500 mt-0.5">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* TESTIMONIAL */}
      <section className="py-12 bg-white">
        <figure className="mx-auto max-w-2xl px-4 text-center">
          <blockquote className="font-heading text-xl sm:text-2xl font-semibold leading-relaxed text-[#0B1220]">"I applied on a Sunday and had my first student the very next week. The scheduling and payouts just work — I only have to teach."</blockquote>
          <figcaption className="mt-4 text-sm text-slate-500">— Priya R., Mathematics Teacher · Kolkata</figcaption>
        </figure>
      </section>

      {/* APPLY */}
      <section id="apply" className="py-14 scroll-mt-24" style={{ background: 'linear-gradient(180deg,#F3F6FC,#eef2fb)' }}>
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-center text-[#0B1220]">Apply to teach</h2>
          <p className="mt-2 mb-8 text-center text-slate-500 max-w-xl mx-auto">Complete your profile below — subjects, experience, availability and (for home tuition) your address and travel radius. Our team reviews every application.</p>
          <ApplyForm />
        </div>
      </section>
    </>
  );
}
