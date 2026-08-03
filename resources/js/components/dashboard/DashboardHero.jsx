import { Link } from 'react-router-dom';
import { LogOut, Settings } from 'lucide-react';
import { useAuth } from '../../lib/auth.jsx';

// One header across all four dashboards, tinted per role. Everything below it
// diverges completely — the point of a shared hero is that a parent and a
// teacher recognise the same product, not that they see the same page.

const ROLE = {
  admin:   { label: 'Admin',   eyebrow: 'Staff dashboard',   from: 'from-[#0B1220]', to: 'to-brand-800' },
  teacher: { label: 'Teacher', eyebrow: 'Teacher workspace', from: 'from-brand-800', to: 'to-brand-600' },
  student: { label: 'Student', eyebrow: 'My learning',       from: 'from-brand-700', to: 'to-[#0f766e]' },
  parent:  { label: 'Parent',  eyebrow: 'My account',        from: 'from-brand-800', to: 'to-brand-500' },
};

export default function DashboardHero({ children }) {
  const { user, logout } = useAuth();
  const role = ROLE[user.role] ?? ROLE.parent;
  // Guard the split: a null name would take the whole dashboard down.
  const firstName = user.name?.split(' ')[0] || 'there';

  return (
    <header className={`rounded-3xl bg-gradient-to-br ${role.from} ${role.to} p-6 text-white sm:p-10`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest text-white/70">{role.eyebrow}</p>
          <h1 className="font-heading mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
            Welcome, {firstName} <span aria-hidden="true">👋</span>
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-white/80">
            <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-bold text-white">{role.label}</span>
            <span className="truncate">{user.email}</span>
            {user.phone && <span>· {user.phone}</span>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/account"
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-white ring-1 ring-white/30 hover:bg-white/10">
            <Settings className="h-4 w-4" /> Account &amp; orders
          </Link>
          <button onClick={() => logout()}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-white ring-1 ring-white/30 hover:bg-white/10">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </div>
      {children}
    </header>
  );
}
