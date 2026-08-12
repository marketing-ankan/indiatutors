import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X, Eye, FileDown, Video, Radio, KeyRound } from 'lucide-react';
import {
  fetchAdminTeacherRows, approveTeacher, updateTeacherApplication,
  toggleTeacherListing, downloadTeacherCv, publishTeacherChanges, discardTeacherChanges,
  fetchProvisionStatus, provisionTeacherLogins,
} from '../../lib/api.js';
import { AdminTable, Chips, SearchBox, Pager, StatusBadge, btnGhost, errText } from './AdminUI.jsx';

// One queue over two tables. A row's `kind` decides which actions it gets:
//   application — someone who filled in the public form and has no account yet.
//                 They can be marked reviewing, approved or rejected, and their
//                 CV and intro video are here.
//   profile     — a registered teacher. They can be approved or rejected, and
//                 listed or unlisted in the public tutor directory.
// Showing the union of both action sets on every row would mean half the
// buttons never work.

const STATUSES = [
  { key: '', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'reviewing', label: 'Reviewing' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

const FIELD_LABEL = {
  tagline: 'Headline', qualification: 'Qualification', experience_years: 'Experience',
  subjects: 'Subjects', city: 'City', languages: 'Languages', teaching_mode: 'Mode',
  localities: 'Service areas', pincodes: 'Pincodes', bio: 'Bio', fee_hourly: 'Fee / hour',
};

/**
 * A4 — what a teacher changed, before it reaches the public page.
 *
 * The before/after is shown rather than a bare "this teacher has edits",
 * because a reviewer who cannot see the change can only rubber-stamp it. The
 * fee line is the one that matters most: a teacher can quietly double their
 * rate, and families are quoted from the public listing.
 */
function PendingChanges({ row, onPublish, onDiscard, busy }) {
  const changes = Object.entries(row.pending_changes || {});
  if (changes.length === 0) return null;

  const show = (v) => (v === null || v === '' ? '—' : String(v));

  return (
    <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50/60 p-2">
      <p className="text-[11px] font-bold text-amber-800">
        Unpublished edits{row.changes_since ? ` · since ${row.changes_since}` : ''}
      </p>
      <ul className="mt-1 space-y-0.5">
        {changes.map(([field, v]) => (
          <li key={field} className="text-[11px] leading-snug">
            <span className="font-semibold text-slate-700">{FIELD_LABEL[field] || field}: </span>
            <span className="text-slate-500 line-through">{show(v.from)}</span>
            <span className="text-slate-400"> → </span>
            <span className="font-semibold text-slate-800">{show(v.to)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-1.5 flex gap-1.5">
        <button type="button" disabled={busy} onClick={onPublish}
          className="rounded-md bg-brand-600 px-2 py-1 text-[11px] font-bold text-white hover:bg-brand-700 disabled:opacity-60">
          Publish
        </button>
        <button type="button" disabled={busy} onClick={onDiscard}
          className="rounded-md px-2 py-1 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200 hover:bg-white disabled:opacity-60">
          Leave unpublished
        </button>
      </div>
    </div>
  );
}

/**
 * Logins for the teachers who were listed before accounts existed.
 *
 * The passwords are shown here once and never again — nothing stores them in a
 * readable form and there is no mail configured to send them. Hence the download
 * button: the artisan command writes a file on the server, which is no use to
 * anyone who cannot reach a shell, which is the whole reason this panel exists.
 */
function TeacherLoginsPanel() {
  const [preview, setPreview] = useState(null);   // dry run
  const [issued, setIssued] = useState(null);     // the real thing, with passwords
  const [err, setErr] = useState('');

  const { data: status, refetch } = useQuery({
    queryKey: ['teacher-provision-status'],
    queryFn: fetchProvisionStatus,
  });
  const pending = status?.pending ?? 0;

  const run = useMutation({
    mutationFn: (dry) => provisionTeacherLogins({ dry_run: dry }),
    onSuccess: (res) => {
      setErr('');
      if (res.dry_run) { setPreview(res); setIssued(null); }
      else { setIssued(res); setPreview(null); refetch(); }
    },
    onError: (e) => setErr(errText(e)),
  });

  const downloadCsv = () => {
    const rows = issued?.created || [];
    const csv = 'teacher,email,password\n' +
      rows.map(r => `"${String(r.name).replace(/"/g, '""')}",${r.email},${r.password}`).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `teacher-logins-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (pending === 0 && !issued) {
    return (
      <div className="mb-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500 ring-1 ring-slate-100">
        Every public listing has a login. Nothing to issue.
      </div>
    );
  }

  return (
    <div className="mb-4 rounded-xl bg-white p-4 ring-1 ring-slate-200">
      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">
        <KeyRound className="h-4 w-4 text-brand-600" /> Teacher logins
      </h3>

      {pending > 0 && (
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          <strong className="text-slate-700">{pending}</strong> listed {pending === 1 ? 'teacher has' : 'teachers have'} no
          way to sign in. Issuing gives each one their own address and password. The address is a
          placeholder — each teacher swaps it for their own under Account → Sign-in addresses.
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" disabled={run.isPending || pending === 0}
          onClick={() => run.mutate(true)}
          className={btnGhost + ' disabled:opacity-50'}>
          {run.isPending ? 'Working…' : 'Preview addresses'}
        </button>
        <button type="button" disabled={run.isPending || pending === 0}
          onClick={() => { if (confirm(`Create ${pending} login(s)? The passwords are shown once and cannot be recovered afterwards.`)) run.mutate(false); }}
          className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-700 disabled:opacity-50">
          Create logins
        </button>
      </div>

      {err && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}

      {preview && (
        <div className="mt-3">
          <p className="mb-1.5 text-xs font-semibold text-slate-600">
            Preview — nothing was created. {preview.created.length} address{preview.created.length === 1 ? '' : 'es'}:
          </p>
          <ul className="max-h-52 overflow-auto rounded-lg bg-slate-50 p-2 text-xs">
            {preview.created.map(r => (
              <li key={r.email} className="flex justify-between gap-3 px-1.5 py-1">
                <span className="text-slate-700">{r.name}</span>
                <span className="font-mono text-slate-500">{r.email}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {issued && (
        <div className="mt-3">
          <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 ring-1 ring-amber-100">
            Copy or download these now — the passwords are not stored anywhere and cannot be shown again.
            If you lose them, reset each password from the Users tab.
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button type="button" onClick={downloadCsv}
              className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800">
              Download CSV
            </button>
            <span className="text-xs text-slate-500">{issued.created.length} created{issued.skipped.length ? `, ${issued.skipped.length} skipped` : ''}</span>
          </div>
          <div className="mt-2 max-h-64 overflow-auto rounded-lg ring-1 ring-slate-100">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-left text-[11px] uppercase text-slate-500">
                <tr><th className="px-2 py-1.5">Teacher</th><th className="px-2 py-1.5">Email</th><th className="px-2 py-1.5">Password</th></tr>
              </thead>
              <tbody>
                {issued.created.map(r => (
                  <tr key={r.email} className="border-t border-slate-100">
                    <td className="px-2 py-1.5 text-slate-700">{r.name}</td>
                    <td className="px-2 py-1.5 font-mono text-slate-600">{r.email}</td>
                    <td className="px-2 py-1.5 font-mono text-slate-900">{r.password}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {issued.skipped.length > 0 && (
            <p className="mt-2 text-[11px] text-slate-500">
              Skipped: {issued.skipped.map(s => `${s.name} (${s.reason})`).join(', ')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function TeachersTab() {
  const qc = useQueryClient();
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-teacher-rows', status, q, page],
    queryFn: () => fetchAdminTeacherRows({ status, q, page }),
    placeholderData: prev => prev,
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['admin-teacher-rows'] });
    qc.invalidateQueries({ queryKey: ['admin-overview'] });
  };
  const onError = e => setError(errText(e));

  // A4 — a teacher's edits reach the public listing only through these.
  const publish = useMutation({
    mutationFn: (id) => publishTeacherChanges(id),
    onSuccess: () => { setError(''); refresh(); },
    onError,
  });
  const discard = useMutation({
    mutationFn: (id) => discardTeacherChanges(id),
    onSuccess: () => { setError(''); refresh(); },
    onError,
  });

  const setProfileStatus = useMutation({ mutationFn: ({ id, status }) => approveTeacher(id, status), onSuccess: refresh, onError });
  const setAppStatus     = useMutation({ mutationFn: updateTeacherApplication, onSuccess: refresh, onError });
  const setListing       = useMutation({ mutationFn: toggleTeacherListing, onSuccess: refresh, onError });
  const busy = setProfileStatus.isPending || setAppStatus.isPending || setListing.isPending
    || publish.isPending || discard.isPending;

  const rows = data?.data ?? [];
  const filter = (key, setter) => { setter(key); setPage(1); };

  return (
    <div className="mt-5">
      <div className="flex flex-wrap items-center gap-3">
        <Chips options={STATUSES} value={status} onChange={k => filter(k, setStatus)} />
        <SearchBox value={q} onChange={v => { setQ(v); setPage(1); }} placeholder="Search teachers…" className="sm:max-w-xs" />
      </div>

      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="mt-4"><TeacherLoginsPanel /></div>

      <AdminTable
        cols={['Teacher', 'Subjects', 'Status', 'Actions']}
        rows={rows}
        loading={isLoading}
        empty="No teachers or applications match."
        minWidth={860}
        renderRow={r => (
          <tr key={`${r.kind}-${r.id}`} className="align-top">
            <td className="px-3 py-3">
              <div className="font-semibold text-slate-800">{r.name}</div>
              <div className="text-xs text-slate-500">{r.email}</div>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${r.kind === 'application' ? 'bg-slate-100 text-slate-600' : 'bg-brand-50 text-brand-700'}`}>
                  {r.kind === 'application' ? 'Applicant' : 'Registered'}
                </span>
                {r.is_listed && <span className="rounded bg-green-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-green-700">Listed</span>}
                {Object.keys(r.pending_changes || {}).length > 0 && (
                  <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-700">Edits to review</span>
                )}
                {r.city && <span className="text-[11px] text-slate-400">{r.city}</span>}
              </div>
              <PendingChanges row={r} onPublish={() => publish.mutate(r.id)} onDiscard={() => discard.mutate(r.id)} busy={busy} />
            </td>
            <td className="px-3 py-3 text-slate-600">
              {r.subjects.length ? r.subjects.join(', ') : <span className="text-slate-400">—</span>}
            </td>
            <td className="px-3 py-3"><StatusBadge status={r.status} /></td>
            <td className="px-3 py-3">
              <div className="flex flex-wrap gap-1.5">
                {r.kind === 'profile' && r.tutor_slug && (
                  <a href={`/tutors/${r.tutor_slug}`} target="_blank" rel="noreferrer" className={btnGhost}>
                    <Eye className="h-3.5 w-3.5" />View
                  </a>
                )}
                {r.has_cv && (
                  <button onClick={() => downloadTeacherCv(r.id, `${r.name}-cv`)} className={btnGhost}>
                    <FileDown className="h-3.5 w-3.5" />CV
                  </button>
                )}
                {r.video_url && (
                  <a href={r.video_url} target="_blank" rel="noreferrer" className={btnGhost}>
                    <Video className="h-3.5 w-3.5" />Intro
                  </a>
                )}
                {r.status !== 'approved' && (
                  <button disabled={busy} onClick={() => (r.kind === 'profile' ? setProfileStatus : setAppStatus).mutate({ id: r.id, status: 'approved' })}
                    className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-green-700 disabled:opacity-50">
                    <Check className="h-3.5 w-3.5" />Approve
                  </button>
                )}
                {/* "Reviewing" only exists on applications — teacher_profiles
                    has no such status, so the button is not offered there. */}
                {r.kind === 'application' && r.status !== 'reviewing' && (
                  <button disabled={busy} onClick={() => setAppStatus.mutate({ id: r.id, status: 'reviewing' })} className={btnGhost}>
                    Review
                  </button>
                )}
                {r.status !== 'rejected' && (
                  <button disabled={busy} onClick={() => (r.kind === 'profile' ? setProfileStatus : setAppStatus).mutate({ id: r.id, status: 'rejected' })}
                    className={btnGhost + ' hover:text-red-600 hover:ring-red-200'}>
                    <X className="h-3.5 w-3.5" />Reject
                  </button>
                )}
                {/* The reference's "Active": on this platform that means the
                    public tutor directory listing. */}
                {r.kind === 'profile' && (
                  <button disabled={busy} onClick={() => setListing.mutate({ id: r.id, is_listed: !r.is_listed })}
                    className={btnGhost + (r.is_listed ? ' text-green-700 ring-green-200' : '')}>
                    <Radio className="h-3.5 w-3.5" />{r.is_listed ? 'Unlist' : 'List'}
                  </button>
                )}
              </div>
            </td>
          </tr>
        )}
      />
      <Pager meta={data?.meta} page={page} setPage={setPage} />
    </div>
  );
}
