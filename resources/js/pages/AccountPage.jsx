import { Navigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import AccountSettingsCard from '../components/AccountSettingsCard.jsx';
import MyOrdersCard from '../components/MyOrdersCard.jsx';

// "Account & orders" — the page the dashboard hero links to, for every role.
// Details and password live here rather than on the dashboard so the dashboard
// stays about the work: classes for a learner, the console for staff.

export default function AccountPage() {
  const { isAuthed, isLoading } = useAuth();

  if (isLoading) return <div className="mx-auto max-w-3xl px-4 py-20 text-slate-500">Loading…</div>;
  if (!isAuthed) return <Navigate to="/login" replace />;

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </Link>
      <h1 className="font-heading mt-3 text-3xl font-extrabold tracking-tight">Account &amp; orders</h1>
      <p className="mt-1 text-sm text-slate-500">Your details, your password and everything you have bought.</p>

      <div className="mt-6 space-y-6">
        <AccountSettingsCard />
        <MyOrdersCard />
      </div>
    </div>
  );
}
