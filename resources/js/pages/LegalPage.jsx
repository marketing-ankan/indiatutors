import { Link } from 'react-router-dom';
import { LEGAL } from '../data/legal.js';

export default function LegalPage({ doc }) {
  const content = LEGAL[doc];
  if (!content) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-xs text-slate-500 mb-2">
        <Link to="/" className="hover:text-brand-600">Home</Link> / <span className="text-slate-700">{content.title}</span>
      </div>
      <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight">{content.title}</h1>
      <p className="mt-2 text-sm text-slate-400">Last updated: {content.updated}</p>
      {content.intro && <p className="mt-6 text-slate-600 leading-relaxed">{content.intro}</p>}

      <div className="mt-10 space-y-8">
        {content.sections.map((s, i) => (
          <section key={i}>
            <h2 className="text-lg font-bold text-slate-900 mb-2">{s.h}</h2>
            <div className="space-y-2">
              {s.p.map((para, j) => (
                <p key={j} className="text-slate-600 leading-relaxed">{para}</p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-12 flex gap-4 text-sm">
        <Link to="/privacy" className="text-brand-600 font-semibold hover:underline">Privacy</Link>
        <Link to="/terms" className="text-brand-600 font-semibold hover:underline">Terms</Link>
        <Link to="/refund" className="text-brand-600 font-semibold hover:underline">Refund & Cancellation</Link>
      </div>
    </div>
  );
}
