import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';

const PLANS = [
  { name:'🌱 Starter', sub:'Strong Foundations', price:3499, badge:'', features:['One-on-one live interactive sessions','Individually tailored curriculum','Covers academic and non-academic courses','Post-class doubt clearing support','Monthly progress report','Free trial class included'] },
  { name:'⚡ Advanced', sub:'Focused Learning', price:6999, badge:'Most Popular', features:['Small group sessions for collaborative learning','Specialised SAT / PSAT preparation','High school academic support (Algebra, Physics, Chemistry)','AP course support included','Bi-weekly parent progress calls','Certificate on completion','Free trial class included'] },
  { name:'🏆 Premium', sub:'Holistic Growth', price:11999, badge:'Best Value', features:['Live sessions with top-rated educators','Balanced academic and non-academic programme','Confidence, skills, and goal-oriented learning','Weekly one-on-one mentor sessions','Unlimited doubt clearing via chat','Priority scheduling and tutor selection','Recorded session playback','Certificate + LinkedIn-shareable credential'] },
];

export default function PlansPage() {
  return (
    <>
      <div className="bg-brand-900 text-white py-14 text-center">
        <div className="mx-auto max-w-2xl px-4">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-300 mb-3">No hidden charges · Cancel any time</p>
          <h1 className="text-4xl font-extrabold tracking-tight">Simple, Honest Pricing</h1>
          <p className="mt-4 text-slate-300">First class is always free. Pick a plan that fits your child's needs — or start with a free demo.</p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map(p => (
            <div key={p.name} className={`rounded-2xl bg-white p-6 ring-1 relative ${p.badge === 'Most Popular' ? 'ring-brand-500 shadow-xl' : 'ring-slate-100 shadow-sm'}`}>
              {p.badge && <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 text-white px-4 py-1 text-xs font-bold whitespace-nowrap">{p.badge}</div>}
              <h3 className="font-extrabold text-xl">{p.name}</h3>
              <p className="text-slate-500 text-sm">{p.sub}</p>
              <div className="my-5 flex items-baseline gap-1">
                <span className="text-5xl font-extrabold text-slate-900">₹{p.price.toLocaleString('en-IN')}</span>
                <span className="text-slate-500">/month</span>
              </div>
              <ul className="space-y-2.5 mb-7">
                {p.features.map(f => (
                  <li key={f} className="flex gap-2 items-start text-sm text-slate-600">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />{f}
                  </li>
                ))}
              </ul>
              <Link to="/book-demo" className={`block text-center rounded-lg py-3 font-bold ${p.badge==='Most Popular'?'bg-brand-600 text-white hover:bg-brand-700':'bg-slate-100 text-slate-800 hover:bg-slate-200'}`}>Get Started</Link>
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-slate-400 mt-8">All prices in Indian Rupees (₹). GST extra where applicable. Individual hourly sessions also available — <Link to="/contact" className="text-brand-600 hover:underline">contact us</Link> for rates.</p>
      </div>
    </>
  );
}
