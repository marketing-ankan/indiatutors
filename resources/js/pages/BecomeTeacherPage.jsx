import { Link } from 'react-router-dom';

// Mirrors the live /become-a-teacher page: hero + chips, why-cards,
// stats band, and the Apply section (wired to our teacher registration).

const WHY = [
  { icon:'🗓️', t:'Flexible scheduling', d:'Choose your own hours and time zones — teach online from anywhere.' },
  { icon:'👨‍👩‍👧', t:'Students come to you', d:'We market, match and schedule — you focus on teaching.' },
  { icon:'💸', t:'Transparent payouts', d:'Fair, timely payments with no hidden platform cuts.' },
  { icon:'🏆', t:'Grow your profile', d:'Build reviews and a verified public profile that attracts more students.' },
];

const STATS = [['10,000+','Classes delivered'],['20+','Countries'],['100+','Subjects']];

export default function BecomeTeacherPage() {
  return (
    <>
      {/* HERO */}
      <section className="bg-gradient-to-br from-brand-900 to-brand-700 text-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-16 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">Become a Teacher at Indiatutors Online</h1>
          <p className="mt-4 text-lg text-slate-200 leading-relaxed max-w-2xl mx-auto">Share your expertise with students across India and worldwide. Flexible hours, fair pay, and a platform that handles the rest — you just teach.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm font-semibold">
            {['💰 Earn on your schedule','🌍 Global student base','🎯 We bring the students'].map(c => (
              <span key={c} className="rounded-full bg-white/15 ring-1 ring-white/25 px-4 py-1.5">{c}</span>
            ))}
          </div>
        </div>
      </section>

      {/* WHY TEACH */}
      <section className="py-14 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-extrabold text-center mb-9">Why teach with Indiatutors Online?</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {WHY.map(w => (
              <div key={w.t} className="rounded-2xl ring-1 ring-slate-100 p-6">
                <div className="text-3xl mb-3">{w.icon}</div>
                <h3 className="font-bold">{w.t}</h3>
                <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{w.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <div className="bg-slate-50 py-10">
        <div className="mx-auto max-w-3xl px-4 grid grid-cols-3 gap-4 text-center">
          {STATS.map(([n,l]) => (
            <div key={l}>
              <div className="text-3xl font-extrabold text-brand-700">{n}</div>
              <div className="text-xs font-semibold text-slate-500 mt-0.5">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* APPLY */}
      <section className="py-14 bg-white">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <div className="rounded-2xl bg-brand-900 text-white p-8 sm:p-10 text-center">
            <h2 className="text-2xl font-extrabold">Apply to teach</h2>
            <p className="mt-3 text-slate-200 leading-relaxed">Create your teacher account, complete your profile (subjects, experience, fees, availability) and upload your documents. Our team reviews every application — once approved, you're listed and students can be matched to you.</p>
            <Link to="/login" className="mt-6 inline-flex rounded-xl bg-white text-brand-800 px-8 py-3 text-sm font-bold hover:bg-slate-100">Apply Now</Link>
            <p className="mt-4 text-xs text-slate-300">On signup you get a teacher dashboard to build your profile and upload your CV/KYC. Your details are stored securely and never shared with third parties.</p>
          </div>
        </div>
      </section>
    </>
  );
}
