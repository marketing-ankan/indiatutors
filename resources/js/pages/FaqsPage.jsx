import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { FAQS } from '../data/courseDetail.js';

// Site-wide FAQ page (WinQuest-approved feature). Content is the business's
// real 18-question FAQ set (same source the product pages use), in the same
// accordion style, with a demo CTA band.

function FaqItem({ q, a, open, onToggle }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#E7E7EF] bg-white">
      <button type="button" onClick={onToggle} aria-expanded={open}
        className={`flex w-full items-center justify-between gap-3 px-5 py-4 text-left font-bold transition ${open ? 'bg-gradient-to-br from-brand-600 to-[#152C49] text-white' : 'bg-[#FAFBFE] text-[#1A1A1A] hover:bg-slate-100'}`}>
        <span>{q}</span>
        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-transform ${open ? 'rotate-45 bg-white text-brand-600' : 'bg-brand-600 text-white'}`}>
          <Plus className="h-4 w-4" />
        </span>
      </button>
      {open && <div className="px-5 py-4 text-sm leading-relaxed text-slate-600">{a}</div>}
    </div>
  );
}

export default function FaqsPage() {
  const [open, setOpen] = useState(0);
  return (
    <div className="bg-[#f9f9fc]">
      {/* HERO */}
      <section className="relative overflow-hidden text-white" style={{ background: 'linear-gradient(135deg,#0B1220,#1E40AF)' }}>
        <div aria-hidden="true" className="absolute -right-[50px] -top-[50px] h-[220px] w-[220px]" style={{ background: 'radial-gradient(circle,rgba(212,175,55,.32),transparent 70%)' }} />
        <div className="container-wide relative py-14 text-center">
          <span className="mb-3.5 inline-block rounded-full border border-white/[.22] bg-white/[.14] px-3.5 py-1.5 text-[0.82rem] font-bold">❓ Help & Support</span>
          <h1 className="font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">Frequently Asked Questions</h1>
          <p className="mx-auto mt-3 max-w-2xl text-[#cbd5e1]">Everything parents ask us about classes, payments, scheduling and progress — answered in one place.</p>
        </div>
      </section>

      {/* FAQ LIST */}
      <div className="container-wide max-w-4xl py-12">
        <div className="space-y-3">
          {FAQS.map((f, i) => (
            <FaqItem key={f.q} q={f.q} a={f.a} open={open === i} onToggle={() => setOpen(open === i ? -1 : i)} />
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 px-6 py-12 text-center text-white">
          <h2 className="font-heading text-2xl font-extrabold">Still have a question?</h2>
          <p className="mt-2 text-white/90">Talk to us directly, or book a free demo class and see how it works first-hand.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/book-demo" className="rounded-lg bg-white px-6 py-2.5 text-sm font-bold text-brand-700 hover:bg-slate-100">🎯 Book a Free Demo</Link>
            <Link to="/contact" className="rounded-lg border border-white/40 px-6 py-2.5 text-sm font-semibold hover:bg-white/10">Contact Us</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
