import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, ShieldCheck, AlertTriangle, Phone, Loader2 } from 'lucide-react';
import {
  fetchAdminPhysicalProfiles, updateAdminPhysicalProfile,
  fetchAdminRequirements, fetchAdminRequirement, updateAdminRequirement,
} from '../../lib/api.js';
import {
  AdminTable, Chips, SearchBox, Pager, StatusBadge, Modal, btnGhost, errText, day,
} from './AdminUI.jsx';
import { WEEKDAYS } from '../../data/physical.js';

/**
 * Physical / home tuition — the two captured queues, side by side.
 *
 * This tab does not match or suggest anybody: that is the leads-management
 * software's job, and it reads these records over /api/matching/v1/*. What the
 * console is for is making sure the records are worth reading.
 *
 * Hence the "Ready?" column on teachers. A profile missing coordinates,
 * subjects or availability cannot be matched by anything, however good the
 * teacher is — and that is a phone call to make, not a mystery to discover
 * downstream.
 */
export default function PhysicalTab() {
  const [side, setSide] = useState('requirements');

  return (
    <div className="pt-4">
      <Chips value={side} onChange={setSide} options={[
        { key: 'requirements', label: 'Student requests' },
        { key: 'teachers', label: 'Teacher profiles' },
      ]} />
      {side === 'requirements' ? <RequirementsPanel /> : <ProfilesPanel />}
    </div>
  );
}

// ------------------------------------------------------------------ teachers

function ProfilesPanel() {
  const qc = useQueryClient();
  const [status, setStatus] = useState(null);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-physical-profiles', status, q, page],
    queryFn: () => fetchAdminPhysicalProfiles({ status: status ?? '', q, page }),
  });

  const update = useMutation({
    mutationFn: updateAdminPhysicalProfile,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-physical-profiles'] }),
  });

  const rows = data?.data ?? [];

  return (
    <>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Chips value={status} onChange={v => { setStatus(v); setPage(1); }} options={[
          { key: null, label: 'All' },
          { key: 'active', label: 'Live' },
          { key: 'submitted', label: 'Awaiting review' },
          { key: 'draft', label: 'Draft' },
          { key: 'paused', label: 'Paused' },
        ]} />
        <SearchBox value={q} onChange={v => { setQ(v); setPage(1); }} placeholder="Name, email, city or pincode…" />
      </div>

      <AdminTable minWidth={980} loading={isLoading} rows={rows}
        empty="No physical-tuition profiles yet."
        cols={['Teacher', 'Area', 'Reach', 'Ready?', 'Status', '']}
        renderRow={p => (
          <tr key={p.id} className="align-top">
            <td className="px-3 py-3">
              <p className="font-semibold text-slate-800">{p.name}</p>
              <p className="text-xs text-slate-500">{p.email}</p>
              {!p.has_account && <p className="mt-0.5 text-[11px] font-semibold text-amber-700">Applicant — no account yet</p>}
            </td>
            <td className="px-3 py-3 text-slate-600">
              <p>{[p.city, p.district].filter(Boolean).join(', ') || '—'}</p>
              <p className="text-xs text-slate-400">{p.pincode} · {p.state}</p>
            </td>
            <td className="px-3 py-3 text-slate-600">
              <p>{p.radius_km ? `${p.radius_km} km` : 'Does not travel'}</p>
              <p className="text-xs text-slate-400">
                {p.has_coords ? `located (${p.geo_source})` : 'no coordinates'}
              </p>
            </td>
            <td className="px-3 py-3">
              <Readiness p={p} />
            </td>
            <td className="px-3 py-3"><StatusBadge status={p.status} /></td>
            <td className="px-3 py-3">
              <div className="flex flex-wrap gap-1.5">
                {p.status !== 'active' && (
                  <button className={btnGhost} disabled={update.isPending}
                    onClick={() => update.mutate({ id: p.id, status: 'active' })}>Set live</button>
                )}
                {p.status === 'active' && (
                  <button className={btnGhost} disabled={update.isPending}
                    onClick={() => update.mutate({ id: p.id, status: 'paused' })}>Pause</button>
                )}
                {!p.police_verified && (
                  <button className={btnGhost} disabled={update.isPending}
                    onClick={() => update.mutate({ id: p.id, police_verified: true, police_verified_on: new Date().toISOString().slice(0, 10) })}>
                    <ShieldCheck className="h-3.5 w-3.5" /> Mark verified
                  </button>
                )}
              </div>
            </td>
          </tr>
        )} />

      {update.isError && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errText(update.error)}</p>}
      <Pager meta={data?.meta} page={page} setPage={setPage} />
    </>
  );
}

/** The three things the leads software cannot work without, named individually. */
function Readiness({ p }) {
  const items = [
    ['Located', p.has_coords],
    ['Subjects', p.offerings_count > 0],
    ['Timings', p.slots_count > 0],
  ];
  return (
    <div className="space-y-0.5">
      <p className="text-xs font-bold tabular-nums text-slate-700">{p.completeness}%</p>
      <div className="flex flex-wrap gap-1">
        {items.map(([label, ok]) => (
          <span key={label}
            className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
            {ok ? '✓' : '✕'} {label}
          </span>
        ))}
      </div>
    </div>
  );
}

// -------------------------------------------------------------- requirements

function RequirementsPanel() {
  const [status, setStatus] = useState('open');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-requirements', status, q, page],
    queryFn: () => fetchAdminRequirements({ status: status ?? '', q, page }),
  });

  const rows = data?.data ?? [];

  return (
    <>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Chips value={status} onChange={v => { setStatus(v); setPage(1); }} options={[
          { key: 'open', label: 'Open' },
          { key: 'matched', label: 'Matched' },
          { key: 'on_hold', label: 'On hold' },
          { key: 'closed', label: 'Closed' },
          { key: null, label: 'All' },
        ]} />
        <SearchBox value={q} onChange={v => { setQ(v); setPage(1); }} placeholder="Code, name, phone, city or pincode…" />
      </div>

      <AdminTable minWidth={1020} loading={isLoading} rows={rows}
        empty="No home-tuition requests yet."
        cols={['Request', 'Learner', 'Needs', 'Where', 'Status', '']}
        renderRow={r => (
          <tr key={r.id} className="align-top">
            <td className="px-3 py-3">
              <p className="font-mono text-xs font-bold text-slate-500">{r.code}</p>
              <p className="text-xs text-slate-400">{day(r.created_at)}</p>
              {r.urgency === 'immediate' && <span className="mt-1 inline-block rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-600">Urgent</span>}
            </td>
            <td className="px-3 py-3">
              <p className="font-semibold text-slate-800">{r.learner}</p>
              <p className="text-xs text-slate-500">{[r.grade_label, r.board].filter(Boolean).join(' · ')}</p>
              <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-slate-500">
                <Phone className="h-3 w-3" />{r.contact_phone || '—'}
              </p>
            </td>
            <td className="px-3 py-3 text-slate-600">
              <p>{(r.subjects || []).join(', ') || '—'}</p>
              {r.budget && <p className="text-xs text-slate-400">up to ₹{r.budget}/hr</p>}
            </td>
            <td className="px-3 py-3 text-slate-600">
              <p>{r.city || '—'}</p>
              <p className="text-xs text-slate-400">{r.pincode}</p>
              {!r.has_coords && (
                <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700">
                  <AlertTriangle className="h-3 w-3" /> not located
                </p>
              )}
            </td>
            <td className="px-3 py-3">
              <StatusBadge status={r.status} />
              {r.matched_profile_id && (
                <p className="mt-1 text-[11px] text-slate-400">assigned in leads software</p>
              )}
            </td>
            <td className="px-3 py-3">
              <button className={btnGhost} onClick={() => setViewing(r)}>
                <Eye className="h-3.5 w-3.5" /> View
              </button>
            </td>
          </tr>
        )} />

      <Pager meta={data?.meta} page={page} setPage={setPage} />

      {viewing && <RequirementModal requirement={viewing} onClose={() => setViewing(null)} />}
    </>
  );
}

/**
 * The whole request on one screen, plus hold/close/notes.
 *
 * Read-and-triage: no candidate list and no assign button. A coordinator opens
 * this to read what the family said before calling them, or to park a request.
 * Choosing the teacher happens in the leads-management software, which reads
 * these same fields over the export.
 */
function RequirementModal({ requirement, onClose }) {
  const qc = useQueryClient();
  const [note, setNote] = useState('');

  const { data: r, isLoading } = useQuery({
    queryKey: ['admin-requirement', requirement.id],
    queryFn: () => fetchAdminRequirement(requirement.id),
  });

  const save = useMutation({
    mutationFn: (patch) => updateAdminRequirement({ id: requirement.id, ...patch }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-requirements'] });
      qc.invalidateQueries({ queryKey: ['admin-requirement', requirement.id] });
      onClose();
    },
  });

  return (
    <Modal wide title={`Request ${requirement.code}`} onClose={onClose}
      subtitle={`${(requirement.subjects || []).join(', ')} · ${requirement.grade_label || '—'} · ${requirement.city || requirement.pincode}`}>

      {isLoading || !r ? (
        <p className="py-8 text-center text-slate-400"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></p>
      ) : (
        <div className="max-h-[55vh] space-y-3 overflow-y-auto pr-1">
          <Group title="Contact">
            <Detail label="Name" value={r.contact_name} />
            <Detail label="Phone" value={r.contact_phone} />
            <Detail label="Email" value={r.contact_email} />
            <Detail label="Best time to call" value={r.best_time_to_call} />
            <Detail label="WhatsApp ok" value={r.whatsapp_consent ? 'yes' : 'no'} />
          </Group>

          <Group title="Learner">
            <Detail label="Name" value={r.learner_name} />
            <Detail label="Class" value={r.grade_label} />
            <Detail label="Board" value={r.board} />
            <Detail label="School" value={r.school} />
            <Detail label="Medium" value={r.medium} />
            <Detail label="Students" value={r.learner_count > 1 ? `${r.learner_count} together` : null} />
            <Detail label="Extra support" value={r.special_needs ? 'yes' : null} />
          </Group>

          <Group title="Needs">
            <Detail label="Subjects" value={(r.subjects || []).join(', ')} />
            <Detail label="Goal" value={r.goal?.replace('_', ' ')} />
            <Detail label="Exam" value={r.exam_target} />
            <Detail label="Per week" value={r.sessions_per_week ? `${r.sessions_per_week} classes` : null} />
            <Detail label="Length" value={r.session_minutes ? `${r.session_minutes} min` : null} />
            <Detail label="Urgency" value={r.urgency?.replace('_', ' ')} />
          </Group>

          <Group title="Where">
            <Detail label="Address" value={[r.address_line1, r.address_line2, r.landmark].filter(Boolean).join(', ')} />
            <Detail label="Area" value={[r.locality, r.city].filter(Boolean).join(', ')} />
            <Detail label="District" value={[r.district, r.state].filter(Boolean).join(', ')} />
            <Detail label="Pincode" value={r.pincode} />
            <Detail label="Located" value={r.latitude != null ? `${r.geo_source} (${r.latitude}, ${r.longitude})` : 'no coordinates'} />
            <Detail label="Venue" value={r.venue_preference?.replace('_', ' ')} />
            <Detail label="Max teacher travel" value={r.max_teacher_distance_km ? `${r.max_teacher_distance_km} km` : null} />
          </Group>

          <Group title="When &amp; budget">
            <Detail label="Days" value={(r.preferred_days || []).map(d => WEEKDAYS.find(w => w.n === d)?.short).join(', ')} />
            <Detail label="Times" value={(r.preferred_time_windows || []).map(w => `${w.start}–${w.end}`).join(', ')} />
            <Detail label="Start" value={r.start_date} />
            <Detail label="Budget" value={r.budget_max_hourly ? `≤ ₹${r.budget_max_hourly}/hr` : (r.budget_monthly ? `₹${r.budget_monthly}/mo` : null)} />
          </Group>

          <Group title="Teacher preferences">
            <Detail label="Gender" value={r.preferred_teacher_gender !== 'any' ? r.preferred_teacher_gender : 'no preference'} />
            <Detail label="Languages" value={(r.preferred_teacher_languages || []).join(', ')} />
            <Detail label="Min experience" value={r.min_teacher_experience ? `${r.min_teacher_experience} y` : null} />
            <Detail label="Group ok" value={r.group_ok ? 'yes' : null} />
          </Group>

          {(r.focus_areas || r.special_needs_note || r.notes) && (
            <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
              {r.focus_areas && <p><strong>Focus:</strong> {r.focus_areas}</p>}
              {r.special_needs_note && <p className="mt-1"><strong>Support:</strong> {r.special_needs_note}</p>}
              {r.notes && <p className="mt-1"><strong>Staff notes:</strong> {r.notes}</p>}
            </div>
          )}
        </div>
      )}

      <div className="mt-4 border-t border-slate-100 pt-3">
        <textarea rows={2} value={note} onChange={e => setNote(e.target.value)}
          placeholder="Add a staff note (optional)"
          className="w-full rounded-lg px-3 py-2 text-sm ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500" />
        <div className="mt-2 flex flex-wrap gap-2">
          <button className={btnGhost} disabled={save.isPending}
            onClick={() => save.mutate({ status: 'on_hold', ...(note ? { notes: note } : {}) })}>Put on hold</button>
          <button className={btnGhost} disabled={save.isPending}
            onClick={() => save.mutate({ status: 'closed', ...(note ? { notes: note } : {}) })}>Close request</button>
          {note && (
            <button className={btnGhost} disabled={save.isPending}
              onClick={() => save.mutate({ notes: note })}>Save note only</button>
          )}
        </div>
        {save.isError && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errText(save.error)}</p>}
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
        Teacher assignment happens in the leads-management software, which reads this request over the
        matching export and writes the chosen teacher back here.
      </p>
    </Modal>
  );
}

function Group({ title, children }) {
  return (
    <div>
      <h4 className="mb-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">{title}</h4>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 rounded-lg bg-slate-50 p-3 text-xs sm:grid-cols-3">
        {children}
      </dl>
    </div>
  );
}

function Detail({ label, value }) {
  if (!value) return null;
  return (
    <div className="min-w-0">
      <dt className="font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="break-words text-slate-700 first-letter:uppercase">{value}</dd>
    </div>
  );
}
