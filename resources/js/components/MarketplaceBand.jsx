import { Link, useLocation } from 'react-router-dom';
import { JOURNEY } from '../data/courseDetail.js';

// Global pre-footer band the live site shows on every marketing page.
// Hidden on the app routes (dashboard / admin / login) where the live site
// also omits it.
const HIDDEN = ['/dashboard', '/admin', '/login'];

export default function MarketplaceBand() {
  const { pathname } = useLocation();
  if (HIDDEN.some(p => pathname === p || pathname.startsWith(p + '/'))) return null;

  return (
    <section className="bg-gradient-to-br from-[#0B1220] to-brand-800 text-white py-16">
      <div className="container-wide text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">India's Most Trusted Online Tutor Marketplace</h2>
        <p className="mt-3 text-slate-300 max-w-2xl mx-auto">Connect with expert tutors for academics, music, coding, languages &amp; more. First demo class is always free — no credit card needed.</p>
        <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/book-demo" className="rounded-xl bg-[#D4AF37] text-[#0B1220] px-7 py-3 text-sm font-bold shadow-lg shadow-[#D4AF37]/30 hover:brightness-105">📅 Book a Free Demo</Link>
          <Link to="/find-tutors" className="rounded-xl border border-white/60 px-7 py-3 text-sm font-bold hover:bg-white/10">👩‍🏫 Find a Tutor</Link>
        </div>

        {/* Feature cards (relocated here from the course-page closing CTA) */}
        <div className="mt-10 grid gap-4 text-left sm:grid-cols-2 lg:grid-cols-4">
          {JOURNEY.map(j => (
            <div key={j.t} className="rounded-2xl bg-white/[.06] p-5 ring-1 ring-white/10">
              <div className="text-2xl">{j.icon}</div>
              <h3 className="mt-2 font-bold">{j.t}</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-300">{j.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
