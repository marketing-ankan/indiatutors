import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, ShieldCheck } from 'lucide-react';
import { fetchUserDashboard, inr } from '../../lib/api.js';
import { StatusBadge, day } from './AdminUI.jsx';

// "View dashboard" — a read-only snapshot composed on the server.
//
// Deliberately not impersonation: signing in as someone would mean minting a
// token for their account, and there is no policy layer here to constrain what
// that token could then do. Every open is written to the audit log.

export default function UserDashDrawer({ userId, onClose }) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin-user-dash', userId],
    queryFn: () => fetchUserDashboard(userId),
    enabled: !!userId,
  });

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-lg overflow-y-auto bg-white shadow-xl">
        <header className="sticky top-0 flex items-start justify-between gap-3 border-b border-slate-100 bg-white p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-600">Account snapshot</p>
            <h3 className="font-heading text-lg font-extrabold text-[#0B1220]">{data?.user?.name ?? 'Loading…'}</h3>
            {data?.user && <p className="text-xs text-slate-500">{data.user.email} · {data.user.role} · joined {day(data.user.joined)}</p>}
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700" aria-label="Close"><X className="h-5 w-5" /></button>
        </header>

        <div className="space-y-5 p-5">
          <p className="flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
            Read-only. Opening this does not sign you in as them, and it is recorded in the audit log.
          </p>

          {isLoading && <p className="text-sm text-slate-400">Loading…</p>}
          {isError && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error?.response?.data?.message ?? 'Could not load this account.'}</p>}

          {data && (
            <>
              {data.student_profile && (
                <Section title="Their student profile">
                  <p className="text-sm text-slate-700">
                    <span className="rounded bg-brand-50 px-1.5 py-0.5 font-mono text-[11px] font-bold text-brand-700">{data.student_profile.code}</span>
                    {' '}{data.student_profile.name}
                  </p>
                </Section>
              )}

              <Section title={`Students (${data.students.length})`} empty={!data.students.length && 'No student profiles.'}>
                <ul className="space-y-1.5">
                  {data.students.map(s => (
                    <li key={s.id} className="rounded-lg px-3 py-2 ring-1 ring-slate-100">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-slate-800">{s.name}</span>
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-600">{s.code}</span>
                      </div>
                      <div className="text-xs text-slate-500">{[s.grade, s.subjects, `${s.enrollments_count} enrolment(s)`].filter(Boolean).join(' · ')}</div>
                    </li>
                  ))}
                </ul>
              </Section>

              <Section title={`Enrolments (${data.enrollments.length})`} empty={!data.enrollments.length && 'No enrolments.'}>
                <ul className="space-y-1.5">
                  {data.enrollments.map(e => (
                    <li key={e.id} className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm ring-1 ring-slate-100">
                      <span className="min-w-0 truncate text-slate-700">
                        {e.course || e.plan || 'Enrolment'}{e.student ? ` · ${e.student}` : ''}{e.tutor ? ` · ${e.tutor}` : ''}
                      </span>
                      <StatusBadge status={e.status} />
                    </li>
                  ))}
                </ul>
              </Section>

              <Section title={`Orders (${data.orders.length})`} empty={!data.orders.length && 'No orders.'}>
                <ul className="space-y-1.5">
                  {data.orders.map(o => (
                    <li key={o.id} className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm ring-1 ring-slate-100">
                      <span className="min-w-0 truncate text-slate-700">#{o.id} · {(o.items || []).map(i => i.name).join(', ') || '—'}</span>
                      <span className="flex shrink-0 items-center gap-2">
                        <span className="font-bold tabular-nums">{inr(o.total)}</span>
                        <StatusBadge status={o.status} />
                      </span>
                    </li>
                  ))}
                </ul>
              </Section>

              <Section title={`Bookings (${data.bookings.length})`} empty={!data.bookings.length && 'No bookings.'}>
                <ul className="space-y-1.5">
                  {data.bookings.map(b => (
                    <li key={b.id} className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm ring-1 ring-slate-100">
                      <span className="min-w-0 truncate text-slate-700">{b.course?.name || b.subject || 'General enquiry'} · {b.type}</span>
                      <StatusBadge status={b.status} />
                    </li>
                  ))}
                </ul>
              </Section>

              {data.video_courses.length > 0 && (
                <Section title="Video courses owned">
                  <ul className="space-y-1 text-sm text-slate-700">
                    {data.video_courses.map(c => <li key={c.slug}>{c.title}</li>)}
                  </ul>
                </Section>
              )}

              {data.teacher_profile && (
                <Section title="Teacher profile">
                  <p className="flex items-center gap-2 text-sm text-slate-700">
                    <StatusBadge status={data.teacher_profile.status} />
                    {data.teacher_profile.headline || <span className="text-slate-400">No headline yet</span>}
                  </p>
                </Section>
              )}
            </>
          )}
        </div>
      </aside>
    </>
  );
}

function Section({ title, children, empty }) {
  return (
    <section>
      <h4 className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">{title}</h4>
      {empty ? <p className="text-sm text-slate-400">{empty}</p> : children}
    </section>
  );
}
