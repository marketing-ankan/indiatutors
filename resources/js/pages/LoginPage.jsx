import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <div className="mx-auto w-14 h-14 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mb-5">
        <Lock className="h-6 w-6" />
      </div>
      <h1 className="text-2xl font-extrabold tracking-tight">Student & Tutor accounts are coming soon</h1>
      <p className="mt-3 text-slate-600 leading-relaxed">
        We're building your personal dashboard — track classes, curriculum progress and payments in one place.
        In the meantime, book a free demo and our team will get you started.
      </p>
      <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
        <Link to="/book-demo" className="rounded-lg bg-brand-600 text-white px-6 py-3 text-sm font-bold hover:bg-brand-700">Book a Free Demo</Link>
        <Link to="/courses" className="rounded-lg border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Browse Courses</Link>
      </div>
    </div>
  );
}
