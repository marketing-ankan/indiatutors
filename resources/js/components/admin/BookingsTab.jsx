import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, UserCheck, GraduationCap } from 'lucide-react';
import {
  fetchAdminDemoRequests, fetchTutors, assignDemo, convertDemo, deleteAdminDemo,
} from '../../lib/api.js';
import {
  AdminTable, Chips, SearchBox, Pager, StatusBadge, Modal, ConfirmDialog,
  btnGhost, btnPrimary, inp, errText, day,
} from './AdminUI.jsx';

// Every booking the public form takes, of all five kinds. Until the `type`
// column landed the kind was only recorded as a "[Book a Free Workshop]"
// prefix inside the message, so this filter row could not exist.

const TYPES = [
  { key: '', label: 'All types' },
  { key: 'demo', label: 'Demo' },
  { key: 'group', label: 'Group class' },
  { key: 'workshop', label: 'Workshop' },
  { key: 'free', label: 'Free class' },
  { key: 'physical', label: 'Home tutor' },
];
const TYPE_LABEL = Object.fromEntries(TYPES.map(t => [t.key, t.label]));

const STATUSES = [
  { key: '', label: 'All' },
  { key: 'new', label: 'New' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'converted', label: 'Converted' },
  { key: 'closed', label: 'Closed' },
];

// Last six months, newest first — the window staff actually work in.
const monthOptions = () => {
  const out = [{ key: '', label: 'All months' }];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
    });
  }
  return out;
};

export default function BookingsTab() {
  const qc = useQueryClient();
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [month, setMonth] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [details, setDetails] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-bookings', type, status, month, q, page],
    queryFn: () => fetchAdminDemoRequests({ type, status, month, q, page }),
    placeholderData: prev => prev,
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['admin-bookings'] });
    qc.invalidateQueries({ queryKey: ['admin-overview'] });
  };
  const remove = useMutation({ mutationFn: deleteAdminDemo, onSuccess: () => { setDeleting(null); refresh(); } });

  const rows = data?.data ?? [];
  const reset = fn => v => { fn(v); setPage(1); };

  return (
    <div className="mt-5">
      <div className="space-y-2">
        <Chips options={monthOptions()} value={month} onChange={reset(setMonth)} />
        <Chips options={TYPES} value={type} onChange={reset(setType)} />
        <div className="flex flex-wrap items-center gap-3">
          <Chips options={STATUSES} value={status} onChange={reset(setStatus)} />
          <SearchBox value={q} onChange={reset(setQ)} placeholder="Search name, email, phone…" className="sm:max-w-xs" />
        </div>
      </div>

      <AdminTable
        cols={['Booked by', 'Student', 'Course / subject', 'Type', 'Status', 'Date', 'Actions']}
        rows={rows}
        loading={isLoading}
        empty="No bookings match these filters."
        minWidth={940}
        renderRow={r => (
          <tr key={r.id}>
            <td className="px-3 py-3">
              <div className="font-semibold text-slate-800">{r.name}</div>
              <div className="text-xs text-slate-500">{r.email}{r.phone ? ` · ${r.phone}` : ''}</div>
            </td>
            <td className="px-3 py-3 text-slate-600">{r.student ?? <span className="text-slate-400">—</span>}</td>
            <td className="px-3 py-3 text-slate-600">{r.course?.name || r.subject || <span className="text-slate-400">General enquiry</span>}</td>
            <td className="px-3 py-3">
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                {TYPE_LABEL[r.type] ?? r.type}
              </span>
            </td>
            <td className="px-3 py-3"><StatusBadge status={r.status} /></td>
            <td className="px-3 py-3 whitespace-nowrap text-slate-500">{day(r.created_at)}</td>
            <td className="px-3 py-3">
              <div className="flex flex-wrap gap-1.5">
                <button onClick={() => setDetails(r)} className={btnGhost}>Details</button>
                <button onClick={() => setDeleting(r)} className={btnGhost + ' hover:text-red-600 hover:ring-red-200'}>
                  <Trash2 className="h-3.5 w-3.5" />Delete
                </button>
              </div>
            </td>
          </tr>
        )}
      />
      <Pager meta={data?.meta} page={page} setPage={setPage} />

      <p className="mt-4 text-xs text-slate-400">
        Event sign-ups made before this release were recorded as contact messages and do not appear here.
      </p>

      {details && <BookingDetails booking={details} onClose={() => setDetails(null)} onChanged={refresh} />}
      {deleting && (
        <ConfirmDialog
          title="Delete this booking?"
          message={`${deleting.name}'s ${TYPE_LABEL[deleting.type] ?? deleting.type} request will be removed. This cannot be undone.`}
          busy={remove.isPending}
          error={remove.isError ? errText(remove.error) : ''}
          onConfirm={() => remove.mutate(deleting.id)}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  );
}

/**
 * Assign a tutor, schedule, and convert to an enrolment — the original flow.
 *
 * The dropdown used to be a shortlist this app ranked by the booking's subject
 * and city. That was matching, and matching happens in the leads-management
 * software, so the picker now lists every published tutor unranked, in name
 * order, with a search box. Recording WHO was assigned stays here: the
 * enrolment, classroom and class-log chain all hang off it.
 */
function BookingDetails({ booking, onClose, onChanged }) {
  const [tutorId, setTutorId] = useState(booking.assigned_tutor?.id ? String(booking.assigned_tutor.id) : '');
  const [plan, setPlan] = useState('');
  const [tutorQuery, setTutorQuery] = useState('');

  // Fetched once and filtered in the browser: /api/tutors already returns the
  // whole published roster to every public visitor, so the console doing the
  // same is not a new cost. Move to the endpoint's `search` param if the roster
  // ever outgrows a single response.
  const { data: tutors = [] } = useQuery({
    queryKey: ['tutors', 'all-by-name'],
    queryFn: () => fetchTutors({ sort: 'name' }),
  });

  const q = tutorQuery.trim().toLowerCase();
  const shown = q
    ? tutors.filter(t => `${t.name} ${(t.subjects || []).join(' ')} ${t.city ?? ''}`.toLowerCase().includes(q))
    : tutors;

  const assign  = useMutation({ mutationFn: () => assignDemo(booking.id, { assigned_tutor_id: tutorId || null, status: 'scheduled' }), onSuccess: onChanged });
  const convert = useMutation({ mutationFn: () => convertDemo(booking.id, { tutor_id: tutorId || null, plan: plan || null }), onSuccess: onChanged });

  return (
    <Modal title={booking.name} subtitle={`${TYPE_LABEL[booking.type] ?? booking.type} · ${day(booking.created_at)}`} onClose={onClose} wide>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {[
          ['Email', booking.email], ['Phone', booking.phone], ['Student', booking.student],
          ['Grade', booking.grade], ['Board', booking.board], ['Mode', booking.mode],
          ['City', booking.city], ['Status', booking.status],
        ].map(([k, v]) => (
          <div key={k}>
            <dt className="text-xs font-semibold text-slate-500">{k}</dt>
            <dd className="text-slate-800">{v || '—'}</dd>
          </div>
        ))}
      </dl>
      {booking.account && (
        <p className="mt-3 rounded-lg bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700">
          Made from the registered account {booking.account.email}.
        </p>
      )}

      <div className="mt-5 border-t border-slate-100 pt-4">
        <label className="mb-1 block text-xs font-semibold text-slate-700">Record the assigned tutor</label>
        <input value={tutorQuery} onChange={e => setTutorQuery(e.target.value)}
          placeholder="Search by name, subject or city…" className={inp + ' mb-2'} />
        <select value={tutorId} onChange={e => setTutorId(e.target.value)} className={inp}>
          <option value="">— Select tutor —</option>
          {shown.map(t => <option key={t.id} value={t.id}>{t.name} · {(t.subjects || []).slice(0, 2).join(', ')} · {t.city}</option>)}
        </select>
        {q && shown.length === 0 && (
          <p className="mt-1 text-xs text-slate-500">No tutor matches “{tutorQuery}”.</p>
        )}
        <p className="mt-1 text-[11px] text-slate-400">
          Listed alphabetically, not ranked — who to assign is decided in the leads-management software.
        </p>

        <div className="mt-3 flex flex-wrap items-end gap-2">
          <button disabled={assign.isPending} onClick={() => assign.mutate()} className={btnGhost + ' px-3 py-2 text-sm'}>
            <UserCheck className="h-4 w-4 text-brand-600" /> Assign &amp; schedule
          </button>
          <input value={plan} onChange={e => setPlan(e.target.value)} placeholder="Plan (e.g. Starter)" className={inp + ' w-40'} />
          <button disabled={convert.isPending || !booking.student} title={!booking.student ? 'Needs a linked student profile' : ''}
            onClick={() => convert.mutate()} className={btnPrimary}>
            <GraduationCap className="h-4 w-4" /> Convert to enrolment
          </button>
        </div>

        {!booking.student && (
          <p className="mt-2 text-xs text-amber-600">
            This booking has no linked student profile, so it cannot become an enrolment yet.
          </p>
        )}
        {convert.isError && <p className="mt-2 text-xs text-red-600">{errText(convert.error)}</p>}
        {convert.isSuccess && <p className="mt-2 text-xs font-semibold text-green-700">Enrolled ✓</p>}
        {assign.isSuccess && <p className="mt-2 text-xs font-semibold text-green-700">Assigned ✓</p>}
      </div>
    </Modal>
  );
}
