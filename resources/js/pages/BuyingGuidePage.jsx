import { Link, useParams } from 'react-router-dom';
import { BUYING_GUIDES, STORE_CATEGORIES } from '../data/store.js';

// Buying-guide hub (/buying-guide) and detail (/buying-guide/{slug}) — the
// WinQuest "how to choose" content that supports the instruments store. The
// hub lists all guides; a detail page shows the intro and links to the
// matching store category. (Deep per-guide content can be expanded later.)

export default function BuyingGuidePage() {
  const { slug } = useParams();

  if (!slug) {
    return (
      <div className="mx-auto max-w-5xl px-[clamp(16px,4vw,40px)] pb-20 pt-7">
        <section className="relative mb-8 overflow-hidden rounded-[22px] px-[clamp(24px,5vw,56px)] py-[46px] text-center text-white" style={{ background: 'linear-gradient(135deg,#0B1220,#1E40AF)' }}>
          <div aria-hidden="true" className="absolute -right-[50px] -top-[50px] h-[220px] w-[220px]" style={{ background: 'radial-gradient(circle,rgba(212,175,55,.32),transparent 70%)' }} />
          <span className="relative mb-3.5 inline-block rounded-full border border-white/[.22] bg-white/[.14] px-3.5 py-1.5 text-[0.82rem] font-bold">📖 Free buying guides</span>
          <h1 className="font-heading relative text-3xl font-extrabold tracking-tight sm:text-4xl">How to Choose the Right Instrument or Kit</h1>
          <p className="relative mx-auto mt-3 max-w-2xl text-[#cbd5e1]">Plain-English guides to picking the right size, type and budget for your child — before you spend a rupee.</p>
        </section>

        <div className="grid gap-5 sm:grid-cols-2">
          {BUYING_GUIDES.map(g => (
            <Link key={g.slug} to={`/buying-guide/${g.slug}`} className="group rounded-2xl border border-[#E7E7EF] bg-white p-6 transition hover:-translate-y-1 hover:shadow-xl">
              <div className="text-4xl">{g.icon}</div>
              <h2 className="font-heading mt-3 text-lg font-extrabold text-[#0B1220] group-hover:text-brand-600">{g.title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{g.blurb}</p>
              <span className="mt-3 inline-block text-sm font-bold text-brand-600">Read the guide →</span>
            </Link>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link to="/instruments" className="inline-flex rounded-lg border-2 border-brand-600/35 px-6 py-2.5 text-sm font-bold text-brand-600 hover:bg-brand-50">Browse the store →</Link>
        </div>
      </div>
    );
  }

  const g = BUYING_GUIDES.find(x => x.slug === slug);
  if (!g) return (
    <div className="container-wide py-20 text-center">
      <h1 className="text-2xl font-bold">Guide not found</h1>
      <Link to="/buying-guide" className="mt-4 inline-block text-brand-600">← All buying guides</Link>
    </div>
  );
  const storeCat = STORE_CATEGORIES.find(c => c.guide === slug);

  return (
    <div className="bg-[#f9f9fc]">
      <section className="relative overflow-hidden text-white" style={{ background: 'linear-gradient(135deg,#0B1220,#1E40AF)' }}>
        <div aria-hidden="true" className="absolute -right-[50px] -top-[50px] h-[220px] w-[220px]" style={{ background: 'radial-gradient(circle,rgba(212,175,55,.32),transparent 70%)' }} />
        <div className="container-wide relative py-14 text-center">
          <div className="text-5xl">{g.icon}</div>
          <h1 className="font-heading mx-auto mt-3 max-w-3xl text-3xl font-extrabold tracking-tight sm:text-4xl">{g.title}</h1>
        </div>
      </section>

      <div className="container-wide max-w-3xl py-12">
        <p className="text-lg leading-relaxed text-slate-700">{g.blurb}</p>

        <div className="mt-8 space-y-4">
          {[
            ['Match size to age, not ambition', 'The best first instrument is the one your child can physically play in week one. Comfort beats brand every time.'],
            ['Buy for the next 12 months', 'Pick something they can grow into for about a year — then upgrade once the habit is set.'],
            ['Ask us before you buy', 'Tell us your child\'s age and class and we\'ll recommend the exact model — no guesswork, no overspending.'],
          ].map(([h, d]) => (
            <div key={h} className="rounded-2xl border border-[#e6e8f0] bg-white p-5">
              <h3 className="font-heading font-bold text-[#0B1220]">{h}</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{d}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 px-6 py-10 text-center text-white">
          <h2 className="font-heading text-xl font-extrabold">Ready to pick one?</h2>
          <p className="mt-1 text-white/90">Browse the matching products, or book a free demo and we'll advise.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link to="/instruments" className="rounded-lg bg-white px-6 py-2.5 text-sm font-bold text-brand-700 hover:bg-slate-100">
              {storeCat ? `Shop ${storeCat.name} →` : 'Browse the store →'}
            </Link>
            <Link to="/book-demo" className="rounded-lg border border-white/40 px-6 py-2.5 text-sm font-semibold hover:bg-white/10">Book a Free Demo</Link>
          </div>
        </div>

        <div className="mt-6"><Link to="/buying-guide" className="font-semibold text-brand-600 hover:underline">← All buying guides</Link></div>
      </div>
    </div>
  );
}
