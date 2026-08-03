import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchAdminAudit } from '../../lib/api.js';
import { AdminTable, Chips, SearchBox, Pager } from './AdminUI.jsx';

// Who did what, and when. The log starts from the moment this shipped — there
// is no history to reconstruct, and inventing one would be worse than the gap.

const TYPES = [
  { key: '', label: 'All' },
  { key: 'user', label: 'Accounts' },
  { key: 'teacher_application', label: 'Teacher applications' },
  { key: 'teacher_profile', label: 'Teacher profiles' },
  { key: 'order', label: 'Orders' },
  { key: 'review', label: 'Reviews' },
  { key: 'course', label: 'Courses' },
  { key: 'booking', label: 'Bookings' },
];

// Not just prettier: "role_changed" is a database value, and staff reading the
// log should not have to translate it.
const ACTION_LABEL = {
  user_added: 'account created', user_deleted: 'account deleted', user_updated: 'account edited',
  user_viewed: 'dashboard viewed', role_changed: 'role changed', password_reset: 'password reset',
  teacher_status: 'application decided', teacher_listing: 'directory listing changed',
  order_status: 'order status changed', order_deleted: 'order deleted',
  review_added: 'review added', review_status: 'review moderated', review_deleted: 'review deleted',
  course_added: 'course created', course_updated: 'course edited', course_deleted: 'course deleted',
  booking_deleted: 'booking deleted', student_updated: 'student edited', student_linked: 'student account linked',
  setting_updated: 'setting changed',
};

const detail = d => {
  if (!d) return null;
  if (d.from !== undefined && d.to !== undefined) {
    const fmt = v => (v && typeof v === 'object') ? Object.entries(v).map(([k, x]) => `${k}: ${x}`).join(', ') : String(v);
    return `${fmt(d.from)} → ${fmt(d.to)}`;
  }
  return Object.entries(d).map(([k, v]) => `${k}: ${v}`).join(' · ');
};

export default function AuditTab() {
  const [type, setType] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit', type, q, page],
    queryFn: () => fetchAdminAudit({ type, q, page }),
    placeholderData: prev => prev,
  });
  const rows = data?.data ?? [];

  return (
    <div className="mt-5">
      <div className="flex flex-wrap items-center gap-3">
        <Chips options={TYPES} value={type} onChange={k => { setType(k); setPage(1); }} />
        <SearchBox value={q} onChange={v => { setQ(v); setPage(1); }} placeholder="Search actor, action, object…" className="sm:max-w-xs" />
      </div>

      <AdminTable
        cols={['When', 'Who', 'Action', 'Object', 'Details']}
        rows={rows}
        loading={isLoading}
        empty="Nothing logged yet. Staff actions from now on are recorded here."
        minWidth={900}
        renderRow={r => (
          <tr key={r.id} className="align-top">
            <td className="px-3 py-3 whitespace-nowrap text-slate-500" title={r.when}>{r.when_human}</td>
            <td className="px-3 py-3 text-slate-700">{r.actor}</td>
            <td className="px-3 py-3">
              <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-700">
                {ACTION_LABEL[r.action] ?? r.action}
              </span>
            </td>
            <td className="px-3 py-3 text-slate-600">
              {r.object_label || (r.object_type ? `${r.object_type} #${r.object_id}` : '—')}
            </td>
            <td className="px-3 py-3 text-xs text-slate-500">{detail(r.details) ?? '—'}</td>
          </tr>
        )}
      />
      <Pager meta={data?.meta} page={page} setPage={setPage} />
    </div>
  );
}
