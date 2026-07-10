import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { CheckCircle2 } from 'lucide-react';
import { PRICING } from '../data/pricing.js';
import { submitContact } from '../lib/api.js';

// Faithful port of the live /plans-pricing/ page: hero + chips, value banner
// with pricing-PDF request, New Enrolment calculator (subject × level × class
// type × classes/week × country) and Monthly/Quarterly/Annual plan cards using
// the site's exact math. Cart/checkout arrives with Phase 7 (payments) — until
// then "Enrol" routes into the demo-first flow.

const DISC = Number(PRICING.discount || 40);
const inp = "w-full rounded-md ring-1 ring-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500";
const lbl = "block text-xs font-semibold text-slate-700 mb-1";

const curOf = (country) => PRICING.countries.find(c => c.name === country)?.currency || (country === 'India' ? 'INR' : 'USD');
const fmt = (n, cur) => cur === 'USD'
  ? '$' + (Math.round(n * 100) / 100).toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1')
  : '₹' + Math.round(n).toLocaleString('en-IN');
const grossOf = (net, cur) => { const g = net / (1 - DISC / 100); return cur === 'USD' ? Math.ceil(g) : Math.ceil(g / 50) * 50; };
const rateFor = (subject, level, ctype, cur) => {
  const row = PRICING.rates.find(r => r.name === subject);
  if (!row) return null;
  const arr = ctype === 'group' ? (cur === 'USD' ? row.usdG : row.inrG) : (cur === 'USD' ? (row.usd || row.inr) : row.inr);
  if (!arr) return null;
  const li = Math.max(0, PRICING.levels.indexOf(level));
  return arr[Math.min(li, arr.length - 1)];
};

const GRADES = ['Pre-K','Kindergarten',...Array.from({length:12},(_,i)=>`Grade ${i+1}`)];

function PdfRequestForm() {
  const [f, setF] = useState({ name:'', email:'', country:'India' });
  const [open, setOpen] = useState(false);
  const send = useMutation({
    mutationFn: () => submitContact({
      name: f.name, email: f.email, subject: 'Full pricing PDF request',
      message: `Please send the full pricing PDF.\nCountry: ${f.country}`,
    }),
  });
  if (!open) return (
    <button onClick={()=>setOpen(true)} className="w-full rounded-xl bg-slate-900 text-white py-3.5 text-sm font-bold hover:bg-slate-800">📥 Download Full Pricing PDF</button>
  );
  if (send.isSuccess) return <p className="text-center text-sm font-semibold text-green-700 py-3">✅ Thanks — the full pricing PDF is on its way to your inbox.</p>;
  return (
    <form onSubmit={e=>{e.preventDefault();send.mutate();}} className="grid sm:grid-cols-4 gap-2">
      <input required placeholder="Full Name *" value={f.name} onChange={e=>setF({...f,name:e.target.value})} className={inp}/>
      <input required type="email" placeholder="Email ID *" value={f.email} onChange={e=>setF({...f,email:e.target.value})} className={inp}/>
      <select value={f.country} onChange={e=>setF({...f,country:e.target.value})} className={inp}>
        {PRICING.countries.map(c=><option key={c.name}>{c.name}</option>)}
      </select>
      <button disabled={send.isPending} className="rounded-xl bg-slate-900 text-white py-2.5 text-sm font-bold hover:bg-slate-800 disabled:opacity-60">{send.isPending?'Sending…':'Send me the PDF'}</button>
    </form>
  );
}

function PlanCard({ plan, sel }) {
  const n = useMemo(() => {
    if (!sel.subject || !sel.level) return null;
    const netPC = rateFor(sel.subject, sel.level, sel.ctype, sel.cur);
    if (netPC == null) return { na: true };
    const totalClasses = plan.mult * sel.cpw;
    const net = Math.round(netPC * totalClasses * (1 - plan.discount / 100));
    const gross = Math.round(grossOf(netPC, sel.cur) * totalClasses);
    return { net, gross, totalClasses, off: gross > net ? Math.round((1 - net / gross) * 100) : 0 };
  }, [plan, sel]);

  return (
    <article className={`relative rounded-2xl bg-white p-6 ring-1 ${plan.featured ? 'ring-2 shadow-xl' : 'ring-slate-200 shadow-sm'}`} style={plan.featured ? { ringColor: plan.accent, borderColor: plan.accent } : {}}>
      <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[11px] font-extrabold text-white whitespace-nowrap" style={{ background: plan.accent }}>{plan.badge}</span>
      <h4 className="text-lg font-extrabold mt-1">{plan.name}</h4>
      <p className="text-xs font-semibold" style={{ color: plan.accent }}>{plan.tag}</p>
      <p className="text-xs text-slate-500 mt-0.5">Best for: {plan.best}</p>

      <div className="my-4 min-h-[4.5rem]">
        {!n ? (
          <div className="text-3xl font-extrabold text-slate-300">—</div>
        ) : n.na ? (
          <div>
            <div className="text-xl font-extrabold text-slate-400">N/A</div>
            {sel.ctype === 'group' && <p className="text-xs text-slate-400 mt-1">Group classes not offered for this subject</p>}
          </div>
        ) : (
          <div>
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 tabular-nums">{fmt(n.net, sel.cur)}</span>
              {n.off > 0 && <>
                <span className="text-sm text-slate-400 line-through tabular-nums">{fmt(n.gross, sel.cur)}</span>
                <span className="rounded-full bg-green-50 text-green-700 px-2 py-0.5 text-[11px] font-bold">{n.off}% OFF</span>
              </>}
            </div>
            <p className="text-xs text-slate-500 mt-1">total · {n.totalClasses} classes · {plan.months} mo</p>
          </div>
        )}
      </div>

      <ul className="space-y-2 mb-5">
        {plan.benefits.map(([t, d]) => (
          <li key={t} className="flex gap-2 items-start text-sm">
            <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" style={{ color: plan.accent }}/>
            <span><span className="font-semibold text-slate-800">{t}</span><span className="block text-xs text-slate-500">{d}</span></span>
          </li>
        ))}
      </ul>

      <Link
        to={`/book-demo${sel.subject ? `?subject=${encodeURIComponent(sel.subject)}` : ''}`}
        className={`block text-center rounded-lg py-2.5 text-sm font-bold ${n && !n.na ? 'text-white hover:brightness-95' : 'bg-slate-100 text-slate-400 pointer-events-none'}`}
        style={n && !n.na ? { background: plan.accent } : {}}
      >
        Enrol — start with a free demo
      </Link>
    </article>
  );
}

export default function PlansPage({ initialCtype = 'oneone' }) {
  const [flow, setFlow] = useState('new');
  const [sel, setSel] = useState({ subject:'', level:'Beginner', ctype: initialCtype, cpw:1, grade:'', country:'India', tz:'IST (India)' });
  const set = (k) => (e) => setSel(s => ({ ...s, [k]: k === 'cpw' ? Number(e.target.value) : e.target.value }));
  const cur = curOf(sel.country);
  const fullSel = { ...sel, cur };
  const cats = useMemo(() => {
    const m = new Map();
    PRICING.rates.forEach(r => { if (!m.has(r.cat)) m.set(r.cat, []); m.get(r.cat).push(r.name); });
    return [...m.entries()];
  }, []);
  const regFee = PRICING.regFee[cur] || 0;

  return (
    <div className="bg-slate-50">
      <div className="container-wide py-8 space-y-6">
        {/* HERO */}
        <section className="rounded-3xl bg-gradient-to-br from-[#0B1220] to-brand-800 text-white p-8 sm:p-12 relative overflow-hidden">
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-[radial-gradient(circle,rgba(212,175,55,.25),transparent_70%)]"/>
          <p className="text-sm font-bold text-[#D4AF37] mb-2">💎 Premium online tutoring</p>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">Plans & Pricing</h1>
          <p className="mt-3 text-slate-300 max-w-xl">Affordable, personalised sessions for your kids to excel — flexible plans designed for every learner.</p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold">
            {['🎯 Personalised 1:1 & group','💯 Expert-verified tutors','🌍 20+ countries','⭐ Rated 4.9/5'].map(c => (
              <span key={c} className="rounded-full bg-white/12 ring-1 ring-white/25 px-3.5 py-1.5">{c}</span>
            ))}
          </div>
        </section>

        {/* VALUE BANNER */}
        <section className="rounded-2xl bg-white ring-1 ring-[#D4AF37]/50 p-6 sm:p-8">
          <h2 className="text-xl font-extrabold">🌟 Best-value, high-quality live classes for your child's growth 🚀</h2>
          <ul className="mt-3 mb-5 space-y-1.5 text-sm text-slate-700">
            <li>✅ Low fees, premium teaching</li>
            <li>✅ Up to 40% off + plan savings</li>
            <li>✅ First demo class free</li>
          </ul>
          <PdfRequestForm />
        </section>

        {/* FLOW TABS */}
        <div className="inline-flex flex-wrap rounded-xl bg-white ring-1 ring-slate-200 p-1 gap-1">
          {[['new','New Enrolment'],['existing','Existing Student']].map(([k,label]) => (
            <button key={k} onClick={()=>setFlow(k)} className={`rounded-lg px-5 py-2.5 text-sm font-bold ${flow===k?'bg-brand-600 text-white':'text-slate-600 hover:bg-slate-50'}`}>{label}</button>
          ))}
        </div>

        {flow === 'existing' ? (
          <section className="rounded-2xl bg-white ring-1 ring-slate-100 p-8 text-center">
            <h3 className="text-lg font-extrabold">Already learning with us?</h3>
            <p className="text-sm text-slate-500 mt-1 mb-5">Log in to your dashboard to view your enrollments, progress and renewals.</p>
            <Link to="/login" className="inline-flex rounded-lg bg-brand-600 text-white px-8 py-3 text-sm font-bold hover:bg-brand-700">Log in</Link>
          </section>
        ) : (
          <>
            {/* CALCULATOR */}
            <section className="rounded-2xl bg-white ring-1 ring-slate-100 p-6 sm:p-8">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Choose Subject</label>
                  <select value={sel.subject} onChange={set('subject')} className={inp}>
                    <option value="">— Select a subject —</option>
                    {cats.map(([cat, names]) => (
                      <optgroup key={cat} label={cat}>{names.map(n=><option key={n}>{n}</option>)}</optgroup>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Level</label>
                  <select value={sel.level} onChange={set('level')} className={inp}>
                    {PRICING.levels.map(l=><option key={l}>{l}</option>)}
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label className={lbl}>Class Type</label>
                <div className="grid sm:grid-cols-3 gap-2">
                  {[['oneone','👤 1-on-1 Session'],['group','👥 Group Classes'],['free','🎁 Free Classes']].map(([v,label]) => (
                    <label key={v} className={`flex items-center gap-2 rounded-lg ring-1 px-3.5 py-2.5 text-sm font-semibold cursor-pointer ${sel.ctype===v?'ring-2 ring-brand-600 bg-brand-50 text-brand-800':'ring-slate-200 text-slate-700 hover:bg-slate-50'}`}>
                      <input type="radio" name="ctype" value={v} checked={sel.ctype===v} onChange={set('ctype')} className="accent-brand-600"/>{label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div><label className={lbl}>Classes per Week</label>
                  <select value={sel.cpw} onChange={set('cpw')} className={inp}>{[1,2,3,4,5].map(n=><option key={n} value={n}>{n}</option>)}</select></div>
                <div><label className={lbl}>Student Grade</label>
                  <select value={sel.grade} onChange={set('grade')} className={inp}><option value="">— Optional —</option>{GRADES.map(g=><option key={g}>{g}</option>)}</select></div>
                <div><label className={lbl}>Country</label>
                  <select value={sel.country} onChange={set('country')} className={inp}>{PRICING.countries.map(c=><option key={c.name}>{c.name}</option>)}</select></div>
                <div><label className={lbl}>Time Zone</label>
                  <select value={sel.tz} onChange={set('tz')} className={inp}>{PRICING.timezones.map(t=><option key={t}>{t}</option>)}</select></div>
              </div>
            </section>

            {/* RESULTS */}
            {sel.ctype === 'free' ? (
              <section className="rounded-2xl bg-white ring-1 ring-slate-100 p-8 text-center">
                <h3 className="text-lg font-extrabold">🎁 FREE CLASSES — Try a full free course</h3>
                <p className="text-sm text-slate-500 mt-2 max-w-xl mx-auto">Minimum 5 / maximum 10 students · once a week · up to 3 months. A one-time registration fee applies — no hidden charges, no class fees.</p>
                <p className="mt-4 text-sm font-semibold text-slate-700">One-time registration fee: <span className="text-2xl font-extrabold text-brand-700 tabular-nums">{fmt(regFee, cur)}</span></p>
                <Link to={`/book-demo${sel.subject?`?subject=${encodeURIComponent(sel.subject)}`:''}`} className="mt-5 inline-flex rounded-lg bg-brand-600 text-white px-8 py-3 text-sm font-bold hover:bg-brand-700">Register for Free Classes</Link>
              </section>
            ) : (
              <>
                {!(sel.subject) && <p className="text-center text-sm text-slate-500">👆 Pick a subject and level above to see live prices for every plan.</p>}
                <div className="grid md:grid-cols-3 gap-6 pt-2">
                  {PRICING.plans.map(p => <PlanCard key={p.key} plan={p} sel={fullSel}/>)}
                </div>
                <p className="text-center text-xs text-slate-400">Prices shown before GST ({PRICING.gst}%) where applicable · One-time registration fee {fmt(regFee, cur)} · Online payment & cart arrive soon — enrolment currently starts with a free demo class.</p>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
