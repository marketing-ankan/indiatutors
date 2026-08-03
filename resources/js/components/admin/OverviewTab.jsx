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
  // Each entry is only a queue if it has something in it.
  const queues = [
    need.applications_awaiting > 0 && ['teachers', `${need.applications_awaiting} teacher application${need.applications_awaiting === 1 ? '' : 's'} awaiting review`],
    need.bookings_new > 0 && ['bookings', `${need.bookings_new} new booking${need.bookings_new === 1 ? '' : 's'} not yet assigned`],
    need.reviews_pending > 0 && ['reviews', `${need.reviews_pending} review${need.reviews_pending === 1 ? '' : 's'} waiting to be moderated`],
    need.proposals_pending > 0 && ['content', `${need.proposals_pending} course proposal${need.proposals_pending === 1 ? '' : 's'} from teachers`],
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
            {queues.map(([tab, text]) => (
              <li key={tab}>
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
