import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, UserCheck, GraduationCap, Sparkles } from 'lucide-react';
import {
  fetchAdminDemoRequests, fetchTutors, assignDemo, convertDemo, deleteAdminDemo,
  fetchDemoSuggestions, releaseDemoContact, logDemoSlot,
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

// The demo lifecycle, mirroring App\Models\DemoRequest::STATUSES. 'Completed'
// is the one that matters: it is what makes a demo reviewable and what the
// teacher's conversion rate is measured against.
const STATUSES = [
  { key: '', label: 'All' },
  { key: 'new', label: 'New' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'completed', label: 'Completed' },
  { key: 'converted', label: 'Converted' },
  { key: 'no_show', label: 'No show' },
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

      {/* Re-read the open booking out of the refreshed list, so acting on it
          (mark completed, assign) updates the drawer rather than leaving it
          showing the state it was opened in. Falls back to the captured row if
          a filter has since excluded it — e.g. marking a demo completed while
          the "New" chip is active. */}
      {details && (
        <BookingDetails
          booking={rows.find(r => r.id === details.id) ?? details}
          onClose={() => setDetails(null)}
          onChanged={refresh}
        />
      )}
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

      {booking.requested_tutor && (
        <p className="mt-3 rounded-lg bg-indigo-50 px-3 py-2 text-xs text-indigo-800">
          <strong>The family chose {booking.requested_tutor.name}.</strong>
          {booking.assigned_tutor && booking.assigned_tutor.id !== booking.requested_tutor.id
            ? ` Currently assigned to ${booking.assigned_tutor.name} — reassigning moves the conversion credit.`
            : ' Assign them below to keep the booking with the teacher the family picked.'}
        </p>
      )}

      <LifecycleBar booking={booking} onChanged={onChanged} />
      <Coordination booking={booking} onChanged={onChanged} />

      <div className="mt-5 border-t border-slate-100 pt-4">
        {/* Clear the roster filter on pick, or the select can hide the chosen
            option and render as unselected while the id stays armed. */}
        <DemoSuggestions bookingId={booking.id} onPick={id => { setTutorId(String(id)); setTutorQuery(''); }} />

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
          The full roster, listed alphabetically — the suggestions above are ranked hints, the final call is yours.
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

const SLOT_TONE = {
  proposed: 'bg-amber-50 text-amber-700', accepted: 'bg-green-50 text-green-700',
  declined: 'bg-slate-100 text-slate-500', withdrawn: 'bg-slate-100 text-slate-500',
  superseded: 'bg-slate-100 text-slate-500',
};

/**
 * The coordinator's half of the demo: who may contact the family, and when the
 * class actually is.
 *
 * Contact release is a deliberate act, not a side effect of assigning someone —
 * most of these students are minors and the home-tuition side carries a street
 * address. The button says plainly what it hands over.
 *
 * "Log a time agreed by phone" is the fallback path: teachers propose slots
 * in-app and families accept them there, but a coordinator who settles it on a
 * call still needs somewhere truthful to put the result.
 */
function Coordination({ booking, onChanged }) {
  const [when, setWhen] = useState('');
  const [note, setNote] = useState('');

  const release = useMutation({ mutationFn: (v) => releaseDemoContact(booking.id, v), onSuccess: onChanged });
  const logSlot = useMutation({
    mutationFn: () => logDemoSlot(booking.id, { starts_at: when.replace('T', ' ') + ':00', note: note || null }),
    onSuccess: () => { setWhen(''); setNote(''); onChanged(); },
  });

  const released = !!booking.contact_released_at;
  const slots = booking.slots ?? [];

  return (
    <div className="mt-4 rounded-lg border border-slate-200 p-3">
      <p className="mb-2 text-xs font-bold text-slate-700">Coordination</p>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" disabled={release.isPending || (!released && !booking.assigned_tutor)}
          title={!booking.assigned_tutor && !released ? 'Assign a teacher first' : ''}
          onClick={() => release.mutate(!released)}
          className={btnGhost + ' px-3 py-1.5 text-xs'}>
          {released ? 'Withdraw contact details' : 'Release contact to teacher'}
        </button>
        <span className="text-[11px] text-slate-500">
          {released
            ? `The teacher can see this family's phone and email (released ${booking.contact_released_at}).`
            : 'The teacher sees the enquiry only — no phone, email or address.'}
        </span>
      </div>
      {release.isError && <p className="mt-1 text-xs text-red-600">{errText(release.error)}</p>}

      {slots.length > 0 && (
        <ul className="mt-3 space-y-1">
          {slots.map(s => (
            <li key={s.id} className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold text-slate-800">{s.starts_at}</span>
              <span className={`rounded-full px-2 py-0.5 font-semibold ${SLOT_TONE[s.status] || 'bg-slate-100 text-slate-600'}`}>{s.status}</span>
              <span className="text-slate-400">
                {s.source === 'coordinator' ? 'logged by staff' : 'proposed by teacher'}
                {s.note ? ` · ${s.note}` : ''}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex flex-wrap items-end gap-2">
        <label className="text-[11px] font-semibold text-slate-600">
          Time agreed by phone
          <input type="datetime-local" value={when} onChange={e => setWhen(e.target.value)} className={inp + ' mt-0.5 w-52'} />
        </label>
        <input value={note} onChange={e => setNote(e.target.value)} placeholder="Note (who agreed it)" className={inp + ' w-52'} />
        <button type="button" disabled={!when || logSlot.isPending} onClick={() => logSlot.mutate()}
          className={btnGhost + ' px-3 py-2 text-xs'}>Log &amp; schedule</button>
      </div>
      {logSlot.isError && <p className="mt-1 text-xs text-red-600">{errText(logSlot.error)}</p>}
    </div>
  );
}

// Drive the demo through its lifecycle. Only 'Completed' and 'No show' are
// offered as one-click actions because those two are the ones nothing else
// sets: 'scheduled' comes from Assign & schedule and 'converted' from Convert
// to enrolment, and marking a demo completed is what makes it reviewable and
// countable. 'Contacted' is here so a coordinator can park a booking honestly
// between "arrived" and "time fixed".
const NEXT_STATES = [
  { key: 'contacted', label: 'Mark contacted', when: s => s === 'new' },
  { key: 'completed', label: 'Demo happened',  when: s => ['new', 'contacted', 'scheduled'].includes(s) },
  { key: 'no_show',   label: 'No show',        when: s => ['contacted', 'scheduled'].includes(s) },
];

function LifecycleBar({ booking, onChanged }) {
  const set = useMutation({
    mutationFn: (status) => assignDemo(booking.id, { status }),
    onSuccess: onChanged,
  });
  const actions = NEXT_STATES.filter(a => a.when(booking.status));
  if (actions.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold text-slate-500">Move this demo on:</span>
      {actions.map(a => (
        <button key={a.key} type="button" disabled={set.isPending}
          onClick={() => set.mutate(a.key)}
          className={btnGhost + ' px-3 py-1.5 text-xs'}>{a.label}</button>
      ))}
      {set.isError && <span className="text-xs text-red-600">{errText(set.error)}</span>}
    </div>
  );
}

// Ranked hints for the picker below: subject / grade / mode / city fits, each
// named so staff see WHY a tutor is proposed. Clicking one fills the select —
// it does not assign; the buttons below still do that explicitly.
const WHY_LABEL = { subject: 'subject', grade: 'grade', 'home-visits': 'home visits', 'same-city': 'same city' };

// Track record, staff-only. Deliberately does NOT influence the ordering yet —
// ranking on it is Stage 3, and doing it now would rank teachers on one or two
// demos apiece. A rate is withheld below the minimum sample rather than shown
// as a flattering 100%, so "1 of 1 converted" cannot masquerade as a record.
function TrackRecord({ p }) {
  if (!p || (p.demos_held === 0 && p.review_count === 0)) return null;
  return (
    <span className="flex flex-wrap gap-1">
      {p.review_count > 0 && (
        <span className="rounded-full bg-amber-50 px-2 py-0.5 font-semibold text-amber-700">
          ★ {p.review_avg} ({p.review_count})
        </span>
      )}
      {p.demos_held > 0 && (
        <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-600"
          title={p.rate_pending ? 'Too few completed demos to state a rate yet' : 'Demos that took place and became enrolments'}>
          {p.conversion_rate !== null
            ? `${p.conversion_rate}% converted`
            : `${p.demos_converted}/${p.demos_held} demos`}
        </span>
      )}
    </span>
  );
}

function DemoSuggestions({ bookingId, onPick }) {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-demo-suggestions', bookingId],
    queryFn: () => fetchDemoSuggestions(bookingId),
    staleTime: 60_000,
  });

  if (isLoading) return <p className="mb-3 text-xs text-slate-400">Ranking suggested tutors…</p>;
  if (!data || data.data.length === 0) return null; // nothing scored — the plain roster below is the honest view

  return (
    <div className="mb-4">
      <p className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-slate-700">
        <Sparkles className="h-3.5 w-3.5 text-brand-600" /> Suggested for this booking
      </p>
      <ul className="space-y-1">
        {data.data.map(t => (
          <li key={t.id}>
            <button type="button" onClick={() => onPick(t.id)}
              className="flex w-full flex-wrap items-center gap-x-2 gap-y-1 rounded-lg bg-slate-50 px-3 py-2 text-left text-xs ring-1 ring-transparent transition hover:bg-brand-50 hover:ring-brand-200">
              <strong className="text-slate-800">{t.name}</strong>
              <span className="text-slate-500">{(t.subjects || []).slice(0, 3).join(', ')}{t.city ? ` · ${t.city}` : ''}{t.experience_years ? ` · ${t.experience_years} y` : ''}</span>
              <TrackRecord p={t.performance} />
              <span className="ml-auto flex flex-wrap gap-1">
                {(t.why || []).map(w => (
                  <span key={w} className="rounded-full bg-brand-50 px-2 py-0.5 font-semibold text-brand-700">{WHY_LABEL[w] || w}</span>
                ))}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-1 text-[11px] text-slate-400">Click a suggestion to fill the picker — nothing is assigned until you press the button.</p>
    </div>
  );
}
