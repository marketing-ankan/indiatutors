import { lazy, Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';

// Split out: the console is a large chunk only staff ever open, and it was
// otherwise part of the single bundle every anonymous visitor downloads.
const AdminConsole = lazy(() => import('../components/admin/AdminConsole.jsx'));

// /admin is the staff entry point the header links to. The console itself is a
// component, so an admin opening /dashboard gets exactly the same thing without
// a redirect — see DashboardPage.

export default function AdminPage() {
  const { user, isAuthed, isLoading } = useAuth();

  if (isLoading) return <div className="mx-auto max-w-5xl px-4 py-20 text-slate-500">Loading…</div>;
  if (!isAuthed) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <ShieldAlert className="h-10 w-10 text-red-500 mx-auto mb-3"/>
      <h1 className="text-2xl font-extrabold">Admins only</h1>
      <p className="text-slate-500 mt-2">Your account doesn't have access to the staff console.</p>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="font-heading mb-6 text-3xl font-extrabold tracking-tight">Staff Console</h1>
      <Suspense fallback={<p className="py-10 text-center text-slate-400">Loading console…</p>}>
        <AdminConsole />
      </Suspense>
    </div>
  );
}
