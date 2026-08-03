import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, UserPlus } from 'lucide-react';
import { fetchAdminStudents, fetchAdminSettings, saveAdminSettings } from '../../lib/api.js';
import { AdminTable, SearchBox, Pager, btnGhost, btnPrimary, inp, errText } from './AdminUI.jsx';
import UserDashDrawer from './UserDashDrawer.jsx';

// Every child profile on the platform, plus the one setting that belongs to
// them: the Google review link staff hand to happy parents.

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
      <GoogleReviewSetting />

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

function GoogleReviewSetting() {
  const qc = useQueryClient();
  const { data: settings } = useQuery({ queryKey: ['admin-settings'], queryFn: fetchAdminSettings });
  const [value, setValue] = useState(null);
  const current = value ?? settings?.google_review_url ?? '';

  const save = useMutation({
    mutationFn: () => saveAdminSettings({ google_review_url: current || null }),
    onSuccess: () => { setValue(null); qc.invalidateQueries({ queryKey: ['admin-settings'] }); },
  });

  return (
    <form onSubmit={e => { e.preventDefault(); save.mutate(); }}
      className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
      <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">
        Google Business “write a review” URL
      </label>
      <div className="mt-2 flex flex-wrap gap-2">
        <input value={current} onChange={e => setValue(e.target.value)} placeholder="https://g.page/r/…/review"
          className={inp + ' flex-1 min-w-[220px] bg-white'} />
        <button type="submit" disabled={save.isPending} className={btnPrimary}>
          {save.isPending ? 'Saving…' : 'Save'}
        </button>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Shown to parents when we ask for a review. Find it in Google Business Profile → “Ask for reviews”.
      </p>
      {save.isError && <p className="mt-2 text-xs text-red-600">{errText(save.error)}</p>}
      {save.isSuccess && <p className="mt-2 text-xs text-green-700">Saved.</p>}
    </form>
  );
}
