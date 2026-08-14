import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { LEGAL, LEGAL_NAV } from '../data/legal.js';
import { fetchLegalDoc, fetchLegalNav } from '../lib/api';

// Legal document template, ported from the sister site's policy pages: navy hero
// with the "Legal" eyebrow and an updated/effective line, then a sticky sidebar
// (auto-generated Contents + the Related Policies chevron list) beside the body.
// Sections and subsections are numbered by the renderer, so the source never
// bakes a number into a heading — renumbering is a matter of reordering.
//
// The documents come from the database so an admin can correct a clause without
// a deploy, and legal.js stays bundled as the fallback. Deliberate: these are
// the documents a visitor is told to read before paying, linked from the footer
// of every page, so a failed request must show the last shipped text rather than
// an error or an empty page.

// The only inline markup legal.js may use: **bold** and [label](/path).
function Inline({ text }) {
  const out = [];
  const re = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*/g;
  let last = 0, m, k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1] !== undefined) {
      const [, label, href] = m;
      out.push(href.startsWith('/')
        ? <Link key={k++} to={href} className="font-semibold text-brand-600 hover:underline">{label}</Link>
        : <a key={k++} href={href} className="font-semibold text-brand-600 hover:underline">{label}</a>);
    } else {
      out.push(<strong key={k++} className="font-semibold text-slate-900">{m[3]}</strong>);
    }
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return <>{out}</>;
}

function Block({ b }) {
  switch (b.type) {
    case 'p':
      return <p className="text-[0.95rem] leading-relaxed text-slate-600"><Inline text={b.text} /></p>;

    case 'list':
      return (
        <ul className="space-y-2">
          {b.items.map((it, i) => (
            <li key={i} className="flex gap-2.5 text-[0.95rem] leading-relaxed text-slate-600">
              <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />
              <span><Inline text={it} /></span>
            </li>
          ))}
        </ul>
      );

    case 'olist':
      return (
        <ol className="space-y-2">
          {b.items.map((it, i) => (
            <li key={i} className="flex gap-2.5 text-[0.95rem] leading-relaxed text-slate-600">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[0.7rem] font-bold text-brand-700">{i + 1}</span>
              <span><Inline text={it} /></span>
            </li>
          ))}
        </ol>
      );

    case 'defs':
      return (
        <dl className="divide-y divide-[#E7E7EF] overflow-hidden rounded-xl border border-[#E7E7EF] bg-white">
          {b.items.map(([term, meaning], i) => (
            <div key={i} className="grid gap-1 px-4 py-3 sm:grid-cols-[minmax(0,13rem)_1fr] sm:gap-4">
              <dt className="text-sm font-bold text-slate-900">{term}</dt>
              <dd className="text-sm leading-relaxed text-slate-600"><Inline text={meaning} /></dd>
            </div>
          ))}
        </dl>
      );

    case 'table':
      return (
        <div className="overflow-x-auto rounded-xl border border-[#E7E7EF] bg-white">
          <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
            <thead>
              <tr className="bg-[#FAFBFE]">
                {b.head.map((h, i) => (
                  <th key={i} className="border-b border-[#E7E7EF] px-4 py-3 font-bold text-slate-900">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {b.rows.map((row, i) => (
                <tr key={i} className="border-b border-[#E7E7EF] last:border-0">
                  {row.map((cell, j) => (
                    <td key={j} className="px-4 py-3 align-top leading-relaxed text-slate-600"><Inline text={cell} /></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'steps':
      return (
        <ol className="space-y-3">
          {b.items.map((s, i) => (
            <li key={i} className="flex gap-3.5 rounded-xl border border-[#E7E7EF] bg-white p-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">{i + 1}</span>
              <div>
                <p className="font-bold text-slate-900"><Inline text={s.t} /></p>
                {s.d && <p className="mt-1 text-sm leading-relaxed text-slate-600"><Inline text={s.d} /></p>}
              </div>
            </li>
          ))}
        </ol>
      );

    case 'note': {
      const warn = b.tone === 'warn';
      return (
        <div className={`rounded-xl border-l-4 p-4 text-[0.95rem] leading-relaxed ${warn ? 'border-amber-400 bg-amber-50 text-amber-900' : 'border-brand-500 bg-brand-50 text-slate-700'}`}>
          <Inline text={b.text} />
        </div>
      );
    }

    default:
      return null;
  }
}

function Blocks({ blocks }) {
  if (!blocks?.length) return null;
  return <div className="space-y-4">{blocks.map((b, i) => <Block key={i} b={b} />)}</div>;
}

// Contents + Related Policies. Sticky on desktop, plain stacked card on mobile.
function Sidebar({ doc, activeSlug, nav }) {
  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <nav aria-label="Contents" className="rounded-2xl border border-[#E7E7EF] bg-white p-5">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">Contents</h2>
        <ol className="space-y-1.5">
          {doc.sections.map((s, i) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="flex gap-2 text-sm leading-snug text-slate-600 hover:text-brand-600">
                <span className="shrink-0 tabular-nums text-slate-400">{i + 1}.</span>
                <span>{s.h}</span>
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <nav aria-label="Related policies" className="mt-4 rounded-2xl border border-[#E7E7EF] bg-white p-5">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">Related Policies</h2>
        <ul className="space-y-2">
          {nav.map(([label, href]) => (
            <li key={href}>
              <Link to={href} aria-current={href === `/${activeSlug}` ? 'page' : undefined}
                className={`flex items-center gap-1.5 text-sm ${href === `/${activeSlug}` ? 'font-bold text-brand-700' : 'text-slate-600 hover:text-brand-600'}`}>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-brand-500" />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

export default function LegalPage({ doc: key }) {
  const fallback = LEGAL[key];

  // The bundled copy renders immediately; the database copy replaces it when it
  // arrives. No spinner: a policy page that flashes empty is worse than one that
  // shows the last shipped wording for a moment.
  const { data: live } = useQuery({
    queryKey: ['legal', key],
    queryFn: () => fetchLegalDoc(fallback?.slug ?? key),
    enabled: Boolean(fallback?.slug ?? key),
    staleTime: 10 * 60_000,
    retry: 1,
  });

  const { data: liveNav } = useQuery({
    queryKey: ['legal-nav'], queryFn: fetchLegalNav, staleTime: 10 * 60_000, retry: 1,
  });

  const doc = live ?? fallback;
  if (!doc) return null;

  const nav = liveNav?.length ? liveNav.map(d => [d.title, '/' + d.slug]) : LEGAL_NAV;

  return (
    <div className="bg-[#f9f9fc]">
      {/* HERO */}
      <section className="relative overflow-hidden text-white" style={{ background: 'linear-gradient(135deg,#0B1220,#1E40AF)' }}>
        <div aria-hidden="true" className="absolute -right-[50px] -top-[50px] h-[220px] w-[220px]" style={{ background: 'radial-gradient(circle,rgba(212,175,55,.32),transparent 70%)' }} />
        <div className="container-wide relative py-14">
          <div className="max-w-3xl">
            <span className="mb-3.5 inline-block rounded-full border border-white/[.22] bg-white/[.14] px-3.5 py-1.5 text-[0.82rem] font-bold">⚖️ {doc.eyebrow}</span>
            <h1 className="font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">{doc.title}</h1>
            <p className="mt-3 text-sm text-white/70">
              Last updated: {doc.updated}
              {doc.effective && <> · Effective: {doc.effective}</>}
            </p>
            {doc.intro && <p className="mt-4 text-[#cbd5e1] leading-relaxed">{doc.intro}</p>}
          </div>
        </div>
      </section>

      <div className="container-wide grid gap-8 py-12 lg:grid-cols-[17rem_minmax(0,1fr)]">
        <Sidebar doc={doc} activeSlug={doc.slug} nav={nav} />

        <main className="min-w-0">
          {/* AT A GLANCE */}
          {doc.glance?.length > 0 && (
            <section className="mb-10">
              <h2 className="mb-4 font-heading text-xl font-extrabold text-slate-900">At a Glance</h2>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {doc.glance.map((g, i) => (
                  <div key={i} className="rounded-xl border border-[#E7E7EF] bg-white p-4">
                    <p className="font-bold text-slate-900"><span className="mr-1.5">{g.icon}</span>{g.t}</p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600"><Inline text={g.d} /></p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="space-y-10">
            {doc.sections.map((s, i) => (
              <section key={s.id} id={s.id} className="scroll-mt-24">
                <h2 className="mb-3 font-heading text-xl font-extrabold text-slate-900">
                  <span className="mr-2 text-brand-600">{i + 1}.</span>{s.h}
                </h2>
                <Blocks blocks={s.blocks} />
                {s.subs?.length > 0 && (
                  <div className="mt-5 space-y-5 border-l-2 border-[#E7E7EF] pl-4 sm:pl-5">
                    {s.subs.map((sub, j) => (
                      <div key={j}>
                        <h3 className="mb-2 font-bold text-slate-900">
                          <span className="mr-2 text-slate-400 tabular-nums">{i + 1}.{j + 1}</span>{sub.h}
                        </h3>
                        <Blocks blocks={sub.blocks} />
                      </div>
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>

          {/* CONTACT CARDS */}
          {doc.contact?.length > 0 && (
            <div className="mt-10 grid gap-3 sm:grid-cols-2">
              {doc.contact.map((c, i) => (
                <div key={i} className="rounded-xl border border-[#E7E7EF] bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                    <span className="mr-1.5">{c.icon}</span>{c.label}
                  </p>
                  <p className="mt-1.5 text-sm font-semibold leading-relaxed text-slate-800">
                    {c.href
                      ? <a href={c.href} className="text-brand-600 hover:underline">{c.value}</a>
                      : c.value}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* FOOT NAV — the same four policies, inline for readers who scrolled past the sidebar */}
          <nav aria-label="All policies" className="mt-10 flex flex-wrap gap-x-5 gap-y-2 border-t border-[#E7E7EF] pt-6">
            {nav.map(([label, href]) => (
              <Link key={href} to={href}
                className={`flex items-center gap-1 text-sm ${href === `/${doc.slug}` ? 'font-bold text-slate-400' : 'font-semibold text-brand-600 hover:underline'}`}>
                <ChevronRight className="h-3.5 w-3.5 shrink-0" />{label}
              </Link>
            ))}
          </nav>
        </main>
      </div>
    </div>
  );
}
