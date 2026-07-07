import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
export default function BecomeTeacherPage() {
  const benefits = ['Verified student leads — no cold outreach','Curriculum, PPTs, homework sheets, and question bank','Class calendar with easy reschedule','Monthly payouts, net of TDS','Retention & conversion bonuses','Continuous marketing by Indiatutors'];
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 max-w-4xl">
      <h1 className="text-4xl font-extrabold tracking-tight">Become a Teacher</h1>
      <p className="mt-4 text-lg text-slate-600 leading-relaxed">Teach subjects you love, keep your schedule flexible, and get paid on time. We provide students, curriculum tools, marketing, and a portfolio — you focus on teaching.</p>
      <div className="grid md:grid-cols-2 gap-4 mt-10">
        {benefits.map(b=>(
          <div key={b} className="flex gap-3 items-start"><CheckCircle2 className="h-5 w-5 text-brand-600 mt-0.5 shrink-0"/><span className="text-slate-700">{b}</span></div>
        ))}
      </div>
      <div className="mt-10 rounded-2xl bg-brand-900 text-white p-8">
        <h2 className="text-2xl font-extrabold">Apply now</h2>
        <p className="mt-2 text-slate-200">The full teacher portal is coming in Phase 3. Register your interest and we'll onboard you first.</p>
        <Link to="/contact" className="inline-flex rounded-lg bg-white text-brand-700 px-6 py-2.5 text-sm font-bold hover:bg-slate-100 mt-6">Register interest</Link>
      </div>
    </div>
  );
}
