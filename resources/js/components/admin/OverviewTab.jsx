import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { Tile } from './AdminUI.jsx';

// Headline numbers, and — more useful day to day — what is sitting unattended.

const TILES = [
  ['teacher_applications',  'Teacher applications'],
  ['applications_awaiting', 'Awaiting review', 'warn'],
  ['bookings_this_month',   'Bookings this month'],
  ['orders_this_month',     'Orders this month'],
  ['parents',               'Parents'],
  ['students',              'Students'],
  ['teachers',              'Teachers'],
  ['courses',               'Courses'],
];

export default function OverviewTab({ overview }) {
  if (!overview) return <p className="py-10 text-center text-slate-400">Loading…</p>;

  const t = overview.tiles;
  const need = overview.needs_attention;
  const s = (n, one, many) => `${n} ${n === 1 ? one : many}`;

  // Each entry is only a queue if it has something in it.
  //
  // Order matters: this list is read top-down, and the green "nothing waiting"
  // panel below only appears when every one of these is zero. Four queues used
  // to be missing from it entirely — support, website enquiries, home tuition
  // and reschedules — so unanswered families sat behind a green reassurance
  // that staff had nothing to do. Anything a person is waiting on belongs here.
  const queues = [
    need.applications_awaiting > 0 && ['teachers',  `${s(need.applications_awaiting, 'teacher application', 'teacher applications')} awaiting review`],
    need.bookings_new > 0          && ['bookings',  `${s(need.bookings_new, 'new booking', 'new bookings')} not yet assigned`],
    // Assigned but dateless — out of the "new" queue, so it reads as handled
    // everywhere while the family waits for a time nobody set.
    need.demos_unscheduled > 0     && ['bookings',  `${s(need.demos_unscheduled, 'booking has', 'bookings have')} a teacher but no date yet`],
    need.support_open > 0          && ['support',   `${s(need.support_open, 'support ticket', 'support tickets')} open`],
    need.messages_new > 0          && ['support',   `${s(need.messages_new, 'website enquiry', 'website enquiries')} unread`],
    need.requirements_open > 0     && ['physical',  `${s(need.requirements_open, 'home-tuition requirement', 'home-tuition requirements')} unmatched`],
    need.reschedules_pending > 0   && ['bookings',  `${s(need.reschedules_pending, 'reschedule request', 'reschedule requests')} to answer`],
    need.reviews_pending > 0       && ['reviews',   `${s(need.reviews_pending, 'review', 'reviews')} waiting to be moderated`],
    need.proposals_pending > 0     && ['content',   `${s(need.proposals_pending, 'course proposal', 'course proposals')} from teachers`],
  ].filter(Boolean);

  return (
    <div className="mt-5 space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {TILES.map(([key, label, tone]) => (
          <Tile key={key} label={label} value={t[key] ?? 0} tone={t[key] > 0 ? tone : undefined} />
        ))}
      </div>

      {queues.length > 0 ? (
        <div className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-100">
          <h3 className="flex items-center gap-2 text-sm font-bold text-amber-900">
            <AlertTriangle className="h-4 w-4" /> Needs attention
          </h3>
          <ul className="mt-2 space-y-1">
            {/* Keyed on the text, not the tab — several queues now link to the
                same tab, and a repeated key silently drops list items. */}
            {queues.map(([tab, text]) => (
              <li key={text}>
                <Link to={`#ac-${tab}`} replace className="text-sm font-semibold text-amber-900 underline-offset-2 hover:underline">
                  {text} →
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="rounded-2xl bg-green-50 p-4 text-sm font-semibold text-green-800 ring-1 ring-green-100">
          Nothing waiting on staff right now.
        </div>
      )}
    </div>
  );
}
