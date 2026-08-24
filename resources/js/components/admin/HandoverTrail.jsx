import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Trash2 } from 'lucide-react';
import { fetchAdminHandovers, revokeHandover } from '../../lib/api.js';
import {
  AdminTable, Chips, SearchBox, Pager, StatusBadge, ConfirmDialog, Tile,
  btnGhost, errText, day,
} from './AdminUI.jsx';

/**
 * The distribution chain, both hops, on one clock.
 *
 * Company material reaches a family in two steps that live in two tables: staff
 * give a teacher a course, and the teacher hands one file to one student. Read
 * apart neither answers the question an owner actually asks — "did this teacher
 * get the syllabus, and did the student ever open it?" — because the answer
 * spans both. The server merges them into one reverse-chronological ledger and
 * this screen is that ledger.
 *
 * The two hops share a table but must never be read as the same event: a grant
 * carries no student and no file, a send carries both, and the stage pill says
 * which in words rather than leaving it to be inferred from two empty cells.
 */

const STAGES = [
  { key: '', label: 'Both hops' },
  { key: 'grant', label: 'Admin → teacher' },
  { key: 'send', label: 'Teacher → student' },
];

// A month chip is only ever built from a month the server says carries rows.
// Bookings offers a fixed six-month window instead, which here both offered
// months with nothing behind them and left anything older than six months with
// no chip at all — nothing prunes a grant, so its row keeps its original date
// forever while the entitlement stays live.
const monthChip = key => {
  const [y, m] = String(key).split('-');
  return {
    key,
    label: new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
  };
};

// Both hops are a handover from someone to someone, so the pill names both
// ends: grey for the hop staff make, brand for the hop that reaches a family.
// The tones this started with — indigo-50 #eef2ff and brand-50 #eff4ff — are one
// point of red and two of green apart, below the threshold anyone can see, so
// colour was carrying nothing and only the words told the hops apart.
const STAGE_PILL = {
  grant: {
    from: 'Admin', to: 'Teacher', tone: 'bg-slate-100 text-slate-700',
    hint: 'Staff gave this teacher a course, opening every published file on it to them.',
  },
  send: {
    from: 'Teacher', to: 'Student', tone: 'bg-brand-50 text-brand-700',
    hint: 'A teacher handed one file to one student.',
  },
};

// AdminUI's tone map carries no entry for this feature's four words, so each
// one borrows the tone the console already uses for that meaning. Without it
// "downloaded" and "never opened" both render slate and the Status column stops
// answering the one question it exists for. The first value picks the colour,
// the second is what staff actually read.
const STATUS_VIEW = {
  granted: ['approved', 'Granted'],
  sent: ['pending', 'Sent'],
  viewed: ['scheduled', 'Opened'],
  downloaded: ['completed', 'Downloaded'],
};

// The date goes through the shared formatter; the clock time is sliced out of
// the string rather than parsed. The API sends a naive "YYYY-MM-DD HH:MM"
// already in IST, and AuditTab carries the scar tissue from handing strings
// like that to new Date().
const clock = at => String(at ?? '').slice(11, 16);

const dash = <span className="text-slate-400">—</span>;

export default function HandoverTrail() {
  const qc = useQueryClient();
  const [stage, setStage] = useState('');
  const [month, setMonth] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [revoking, setRevoking] = useState(null);

  const { data, isLoading, isError, error, isPlaceholderData } = useQuery({
    queryKey: ['admin-handovers', stage, month, q, page],
    queryFn: () => fetchAdminHandovers({ stage, month, q, page }),
    placeholderData: prev => prev,
  });

  const rows = data?.data ?? [];
  const totals = data?.totals;

  const revoke = useMutation({
    mutationFn: revokeHandover,
    onSuccess: () => {
      setRevoking(null);
      // Revoking the only row on the last page strands the admin there: the
      // refetch comes back empty, the Pager hides itself below two pages so
      // there is no Previous to press, and the table then prints "nothing has
      // been handed over yet" above tiles still counting the rest of the ledger.
      setPage(p => (rows.length === 1 && p > 1 ? p - 1 : p));
      qc.invalidateQueries({ queryKey: ['admin-handovers'] });
      // The teacher-side screens count the same rows.
      qc.invalidateQueries({ queryKey: ['admin-teacher-materials'] });
      qc.invalidateQueries({ queryKey: ['admin-teacher-material-detail'] });
    },
  });

  // The mutation outlives the dialog — this component never unmounts while the
  // trail is showing — so a failed revoke would still be showing its error
  // inside the next row's confirm box, before that row has been touched.
  const confirmRevoke = row => { revoke.reset(); setRevoking(row); };

  // The server narrows `months` by the month filter as well as by the search, so
  // the moment a month is picked the payload names only that month. Keeping the
  // last answer given with no month selected leaves the neighbouring months on
  // the row; without it, choosing one removes the way back to the others.
  // isPlaceholderData is what tells a fresh answer from the previous one still
  // on screen mid-fetch.
  const knownMonths = useRef([]);
  if (!isPlaceholderData && !month && data?.months) knownMonths.current = data.months;
  // A revoke can empty the month being filtered on. Keep its chip anyway, or the
  // row silently stops showing what is being filtered on.
  const shownMonths = !month || knownMonths.current.includes(month)
    ? knownMonths.current
    : [...knownMonths.current, month].sort().reverse();

  const filtering = !!(stage || month || q.trim());
  const reset = fn => v => { fn(v); setPage(1); };

  // deliveryStatus() reports the furthest stage a send reached and a download
  // wins outright, so the 'viewed' bucket holds only the sends opened and never
  // downloaded. Counted alone it reported "0 opened" beside "1 downloaded" for
  // the same row — and Download is the only control a student is given on a
  // file-backed send, so that count read 0 for the entire normal path. The two
  // buckets together are exactly the sends carrying one stamp or the other.
  //
  // Deliberately not labelled "opened by the student": where a learner has no
  // login of their own the send is addressed to their guardian, whose download
  // stamps downloaded_at while first_viewed_at stays empty. Naming both stamps
  // claims only what was actually recorded.
  const openedOrDownloaded = totals ? totals.viewed + totals.downloaded : null;

  return (
    <div>
      <p className="text-xs text-slate-500">
        Every hop material takes: staff giving a teacher a course, and a teacher sending one file to one
        student. Newest first.
      </p>

      {/* Straight from the API. Counting the rows on screen instead would report
          "3 sends" while meaning "3 sends on page 1", and a missing figure shows
          as an em dash rather than as a zero nobody measured. */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile label="Courses given to teachers" value={totals?.grants ?? '—'} sub="admin → teacher" />
        <Tile label="Files sent to students" value={totals?.sends ?? '—'} sub="teacher → student" />
        <Tile label="Opened or downloaded" value={openedOrDownloaded ?? '—'}
          sub={totals?.sends ? `of ${totals.sends} sent` : null} />
        <Tile label="Downloaded" value={totals?.downloaded ?? '—'}
          sub={totals?.sends ? `of ${totals.sends} sent` : null} />
      </div>
      <p className="mt-1.5 text-[11px] text-slate-400">
        Counted by the server, not from the rows shown on this page.
      </p>

      <div className="mt-4 space-y-2">
        <Chips options={[{ key: '', label: 'All months' }, ...shownMonths.map(monthChip)]}
          value={month} onChange={reset(setMonth)} />
        <div className="flex flex-wrap items-center gap-3">
          <Chips options={STAGES} value={stage} onChange={reset(setStage)} />
          <SearchBox value={q} onChange={reset(setQ)} placeholder="Search teacher, student, file…" className="sm:max-w-xs" />
        </div>
      </div>

      {isError && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {errText(error, 'Could not load the trail — the figures above may be out of date.')}
        </p>
      )}

      <AdminTable
        cols={['When', 'Who acted', 'Teacher', 'Student', 'Course / material', 'Stage', 'Status', 'Actions']}
        rows={rows}
        loading={isLoading}
        empty={isError
          ? 'The trail did not load — this is not an empty result.'
          : filtering
            ? 'No transfer matches these filters.'
            : 'Nothing has been handed over yet. Giving a teacher a course, and a teacher sending a file to a student, both land here as they happen.'}
        // Eight columns, and the two widest carry two lines each: the file with
        // its course, and the teacher's note under it. Below this the wrapper
        // scrolls rather than the columns crushing into each other.
        minWidth={1120}
        renderRow={r => (
          // Ids come from two different tables, so a grant and a send can both
          // be #2 — keying on the id alone silently drops one of them.
          <tr key={`${r.stage}-${r.id}`} className="align-top">
            <td className="px-3 py-3 whitespace-nowrap" title={r.at}>
              <div className="font-semibold text-slate-700">{day(r.at)}</div>
              <div className="text-[11px] tabular-nums text-slate-400">{clock(r.at)}</div>
            </td>

            <td className="px-3 py-3 text-slate-600">{r.actor || dash}</td>
            <td className="px-3 py-3 text-slate-700">{r.teacher || dash}</td>

            <td className="px-3 py-3">
              {r.student
                ? <span className="font-semibold text-slate-800">{r.student}</span>
                : <span className="text-slate-400"
                    title="A grant is not about one student — it opens every published file on that course to the teacher.">—</span>}
            </td>

            {/* The row's subject is whatever actually moved: a file for a send,
                a whole course for a grant. */}
            <td className="px-3 py-3">
              {r.stage === 'send' ? (
                <>
                  <div className="font-semibold text-slate-800">{r.material || dash}</div>
                  <div className="text-[11px] text-slate-400">{r.course || 'no course on this file'}</div>
                </>
              ) : (
                <>
                  <div className="font-semibold text-slate-800">{r.course || dash}</div>
                  <div className="text-[11px] text-slate-400">all published files on this course</div>
                </>
              )}
              {r.note && <p className="mt-1 text-[11px] italic text-slate-500">“{r.note}”</p>}
            </td>

            <td className="px-3 py-3"><Stage stage={r.stage} /></td>
            <td className="px-3 py-3"><Status status={r.status} /></td>

            <td className="px-3 py-3">
              {r.stage === 'send' ? (
                <button onClick={() => confirmRevoke(r)} className={btnGhost + ' hover:text-red-600 hover:ring-red-200'}>
                  <Trash2 className="h-3.5 w-3.5" />Revoke
                </button>
              ) : (
                <span className="text-slate-400" title="A course grant is removed on the teacher’s own card, under Teachers.">—</span>
              )}
            </td>
          </tr>
        )}
      />
      <Pager meta={data?.meta} page={page} setPage={setPage} />

      <p className="mt-4 text-xs text-slate-400">
        Revoking takes one file back from one student. A course grant is removed on the teacher’s own
        card, under Teachers.
      </p>

      {revoking && (
        <ConfirmDialog
          title="Revoke this file?"
          message={
            `${revoking.student || 'This student'} will no longer be able to open or download ` +
            `${revoking.material ? `“${revoking.material}”` : 'this file'} through this send. ` +
            'If their own course already entitles them to the same file they keep it that way, and the ' +
            'file itself is not deleted.'
          }
          confirmLabel="Revoke"
          busy={revoke.isPending}
          error={revoke.isError ? errText(revoke.error) : ''}
          onConfirm={() => revoke.mutate(revoking.id)}
          onClose={() => confirmRevoke(null)}
        />
      )}
    </div>
  );
}

function Stage({ stage }) {
  const s = STAGE_PILL[stage];
  if (!s) return <span className="text-xs text-slate-500">{stage || '—'}</span>;

  // The arrow is decorative — read aloud, "Teacher Student" says nothing about
  // which way it went, so the direction is spelled out in the title instead.
  return (
    <span title={s.hint}
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.tone}`}>
      {s.from}<ArrowRight className="h-3 w-3" aria-hidden="true" />{s.to}
    </span>
  );
}

// An unmapped status is shown as it came rather than guessed at — a word this
// screen does not recognise is a real event that still has to be readable.
function Status({ status }) {
  const known = STATUS_VIEW[status];
  if (!known) return <StatusBadge status={status} />;

  const [tone, label] = known;
  return <StatusBadge status={tone}>{label}</StatusBadge>;
}
