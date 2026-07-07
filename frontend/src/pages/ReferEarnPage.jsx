import { Link } from 'react-router-dom';
import { Gift, UserPlus, Wallet } from 'lucide-react';

export default function ReferEarnPage() {
  return (
    <div className="container-page py-14">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-4xl font-extrabold tracking-tight">Refer & Earn</h1>
        <p className="mt-4 text-slate-600">
          Love your classes? Refer a friend and earn ₹1,000 credit for every friend who enrols —
          your friend gets ₹500 off their first month too.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mt-12 max-w-5xl mx-auto">
        {[
          { icon: UserPlus, t: '1. Share your link', d: 'Log in and copy your unique referral link from the dashboard.' },
          { icon: Gift,     t: '2. Friend enrolls',  d: 'Your friend books a demo and joins any monthly / quarterly / annual plan.' },
          { icon: Wallet,   t: '3. You both earn',   d: 'You get ₹1,000 credit toward your next invoice. Your friend gets ₹500 off.' },
        ].map((s) => (
          <div key={s.t} className="rounded-xl bg-white ring-1 ring-slate-100 p-6">
            <s.icon className="h-8 w-8 text-brand-600" />
            <h3 className="mt-4 font-bold text-lg">{s.t}</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">{s.d}</p>
          </div>
        ))}
      </div>

      <div className="text-center mt-10">
        <Link to="/login" className="btn-primary">Log in to get your link</Link>
      </div>
    </div>
  );
}
