import { Link } from 'react-router-dom';

// Dedicated /free-classes landing page, ported from the live site:
// green hero, reassurance strip, six subject cards (one-time ₹750
// registration), fine print and a closing CTA band.

const CLASSES = [
  { icon:'🎨', title:'Art & Painting',      blurb:'Explore colours, sketching and creative self-expression.',        slug:'arts-painting',  subject:'Art and Painting' },
  { icon:'✂️', title:'Art & Craft Classes', blurb:'Hands-on craft projects that spark imagination and motor skills.', slug:'art-and-craft',  subject:'Art and Craft' },
  { icon:'♟️', title:'Chess Classes',       blurb:'Strategy, focus and critical thinking from the very basics.',      slug:'chess',          subject:'Chess' },
  { icon:'🧩', title:"Rubik's Cube",        blurb:'Solve the cube and boost memory, patience & spatial skills.',      slug:'rubiks-cube',    subject:"Rubik's Cube" },
  { icon:'🇪🇸', title:'Spanish Language',    blurb:'A fun introduction to Spanish for young learners.',                slug:'spanish',        subject:'Spanish' },
  { icon:'🇫🇷', title:'French Language',     blurb:'Begin French through songs, words and simple conversation.',       slug:'french',         subject:'French' },
];

export default function FreeClassesPage() {
  return (
    <div className="bg-slate-50">
      <div className="container-wide py-8 space-y-6">
        {/* HERO — green, like the live page */}
        <section className="rounded-3xl bg-gradient-to-br from-[#064e3b] to-[#15803d] text-white p-8 sm:p-12 relative overflow-hidden">
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-[radial-gradient(circle,rgba(212,175,55,.25),transparent_70%)]"/>
          <span className="inline-block rounded-full bg-white/15 ring-1 ring-white/25 px-3.5 py-1.5 text-xs font-bold mb-4">🎁 Free Classes</span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight max-w-2xl">Free Classes — Learning, On the House</h1>
          <p className="mt-3 text-emerald-100 max-w-xl leading-relaxed">An outreach initiative by Indiatutors Online to spark curiosity and a love of learning in every child — no commitment, just a one-time registration fee.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/book-demo?type=free" className="rounded-xl bg-[#D4AF37] text-[#0B1220] px-6 py-3 text-sm font-bold shadow-lg shadow-[#D4AF37]/30 hover:brightness-105">🚀 Book Now</Link>
            <Link to="/book-demo" className="rounded-xl border border-white/60 px-6 py-3 text-sm font-bold hover:bg-white/10">🎯 Book a Free Demo</Link>
          </div>
        </section>

        {/* REASSURANCE STRIP */}
        <section className="rounded-2xl bg-white ring-1 ring-slate-100 px-6 py-4 flex flex-wrap gap-x-8 gap-y-2 justify-center text-sm font-semibold text-slate-700">
          <span>✅ No commitment</span>
          <span>✅ One-time registration fee only — ₹750</span>
          <span>✅ Pure learning, zero pressure</span>
        </section>

        {/* CLASS CARDS */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {CLASSES.map(c => (
            <article key={c.title} className="rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm p-6 text-center flex flex-col">
              <div className="text-4xl mb-3">{c.icon}</div>
              <h2 className="font-extrabold text-lg text-slate-900">{c.title}</h2>
              <p className="text-sm text-slate-500 mt-1.5 leading-relaxed flex-1">{c.blurb}</p>
              <p className="mt-4 text-sm text-slate-600">One-time registration: <span className="font-extrabold text-slate-900">₹750</span></p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Link to={`/book-demo?type=free&subject=${encodeURIComponent(c.subject)}`} className="rounded-lg bg-brand-600 text-white py-2.5 text-sm font-bold hover:bg-brand-700">Book Now</Link>
                <Link to={`/courses/${c.slug}`} className="rounded-lg ring-1 ring-brand-600 text-brand-700 py-2.5 text-sm font-bold hover:bg-brand-50">View Details</Link>
              </div>
            </article>
          ))}
        </div>

        {/* FINE PRINT */}
        <p className="text-center text-xs text-slate-500 italic max-w-3xl mx-auto">
          *Free classes run with a minimum of 5 and a maximum of 10 students, once a week, for up to 3 months. A one-time registration fee applies — no hidden charges and no class fees. A free demo session is offered before you register.
        </p>

        {/* CTA BAND */}
        <section className="rounded-3xl bg-gradient-to-br from-[#064e3b] to-[#15803d] text-white py-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold">Ready to give your child a head start?</h2>
          <Link to="/book-demo?type=free" className="mt-6 inline-flex rounded-xl bg-[#D4AF37] text-[#0B1220] px-7 py-3 text-sm font-bold shadow-lg shadow-[#D4AF37]/30 hover:brightness-105">🎯 Book a Free Demo</Link>
        </section>
      </div>
    </div>
  );
}
