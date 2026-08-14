import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Eye, UserPlus } from 'lucide-react';
import { fetchAdminStudents } from '../../lib/api.js';
import { AdminTable, SearchBox, Pager, btnGhost } from './AdminUI.jsx';
import UserDashDrawer from './UserDashDrawer.jsx';

// Every child profile on the platform.
//
// The Google review link used to be edited here as well as in Settings — two
// editors for one value, and nothing read it. It now lives in Settings only,
// and the Reviews tab surfaces it where staff actually ask for a review.

export default function StudentsTab() {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-students', q, page],
    queryFn: () => fetchAdminStudents({ q, page }),
    placeholderData: prev => prev,
  });
  const rows = data?.data ?? [];

  return (
    <div className="mt-5">
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <SearchBox value={q} onChange={v => { setQ(v); setPage(1); }} placeholder="Search by name, code, parent…" className="sm:max-w-sm" />
      </div>

      <AdminTable
        cols={['Student', 'Parent', 'Subjects', 'Classes', 'Actions']}
        rows={rows}
        loading={isLoading}
        empty="No students yet."
        minWidth={780}
        renderRow={s => (
          <tr key={s.id}>
            <td className="px-3 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-slate-800">{s.name}</span>
                <span className="rounded bg-brand-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-brand-700">{s.code}</span>
              </div>
              <div className="text-xs text-slate-500">{[s.grade, s.board].filter(Boolean).join(' · ') || 'No grade set'}</div>
            </td>
            <td className="px-3 py-3">
              <div className="text-slate-700">{s.parent?.name ?? '—'}</div>
              <div className="text-xs text-slate-500">{s.parent?.email}</div>
            </td>
            <td className="px-3 py-3 text-slate-600">
              {s.subjects_count} subject{s.subjects_count === 1 ? '' : 's'}
              {s.subjects && <div className="text-xs text-slate-400">{s.subjects}</div>}
            </td>
            <td className="px-3 py-3 tabular-nums text-slate-600">{s.enrollments_count ?? 0}</td>
            <td className="px-3 py-3">
              {/* A student row is a child's profile, not a login. Only the ones
                  that have been given an account have a dashboard to view. */}
              {s.account_user_id ? (
                <button onClick={() => setViewing(s.account_user_id)} className={btnGhost}>
                  <Eye className="h-3.5 w-3.5" />View dashboard
                </button>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs text-slate-400" title="Create one from the Users tab">
                  <UserPlus className="h-3.5 w-3.5" />No account yet
                </span>
              )}
            </td>
          </tr>
        )}
      />
      <Pager meta={data?.meta} page={page} setPage={setPage} />

      {viewing && <UserDashDrawer userId={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}

