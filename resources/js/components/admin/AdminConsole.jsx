import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutGrid, GraduationCap, Users, CalendarClock, ReceiptText, Star,
  BookOpen, UserCog, ScrollText, CalendarDays, Video, Megaphone, Wrench, TrendingUp, Home, LifeBuoy,
  SlidersHorizontal,
} from 'lucide-react';
import { fetchAdminOverview } from '../../lib/api.js';
import OverviewTab from './OverviewTab.jsx';
import TeachersTab from './TeachersTab.jsx';
import StudentsTab from './StudentsTab.jsx';
import BookingsTab from './BookingsTab.jsx';
import OrdersTab from './OrdersTab.jsx';
import ReviewsTab from './ReviewsTab.jsx';
import CoursesTab from './CoursesTab.jsx';
import UsersTab from './UsersTab.jsx';
import AuditTab from './AuditTab.jsx';
import PhysicalTab from './PhysicalTab.jsx';
import SupportTab from './SupportTab.jsx';
import { EventsTab, VideoCoursesTab, ContentTab, AnalyticsTab } from './LegacyTabs.jsx';
import SettingsTab from './SettingsTab.jsx';

// The console. Tabs are addressed by hash (#ac-orders) so a tab can be linked,
// bookmarked and reloaded into — and so the same component serves both
// /dashboard (for an admin) and /admin without any routing changes.

const TABS = [
  { key: 'overview', label: 'Overview',  Icon: LayoutGrid,     Panel: OverviewTab },
  { key: 'teachers', label: 'Teachers',  Icon: GraduationCap,  Panel: TeachersTab,  count: 'teachers' },
  { key: 'students', label: 'Students',  Icon: Users,          Panel: StudentsTab,  count: 'students' },
  { key: 'bookings', label: 'Bookings',  Icon: CalendarClock,  Panel: BookingsTab,  count: 'bookings' },
  // Home tuition is its own queue: it is matched on geography and timings, not
  // converted from a booking, and both sides of it live in different tables.
  { key: 'physical', label: 'Home tuition', Icon: Home,        Panel: PhysicalTab },
  { key: 'orders',   label: 'Orders',    Icon: ReceiptText,    Panel: OrdersTab,    count: 'orders' },
  // Every website enquiry form used to write to a table nothing read. They all
  // land here now, with in-account support threads.
  { key: 'support',  label: 'Support',   Icon: LifeBuoy,       Panel: SupportTab },
  { key: 'reviews',  label: 'Reviews',   Icon: Star,           Panel: ReviewsTab,   count: 'reviews' },
  { key: 'courses',  label: 'Courses',   Icon: BookOpen,       Panel: CoursesTab,   count: 'courses' },
  { key: 'users',    label: 'Users',     Icon: UserCog,        Panel: UsersTab,     count: 'users' },
  { key: 'audit',    label: 'Audit',     Icon: ScrollText,     Panel: AuditTab,     count: 'audit' },
  // Areas this platform has that the reference console does not. They keep
  // their own pills rather than being dropped: the R2 upload flow and the
  // events/exam-update editors all live here.
  { key: 'events',   label: 'Events',        Icon: CalendarDays, Panel: EventsTab },
  { key: 'videos',   label: 'Video courses', Icon: Video,        Panel: VideoCoursesTab },
  { key: 'content',  label: 'Content',       Icon: Megaphone,    Panel: ContentTab },
  { key: 'analytics', label: 'Analytics',    Icon: TrendingUp,   Panel: AnalyticsTab },
  // Site-wide contact details and the four policy pages, both of which used to
  // be code — see SettingsTab.jsx.
  { key: 'settings', label: 'Settings',     Icon: SlidersHorizontal, Panel: SettingsTab },
];

export default function AdminConsole() {
  const { hash } = useLocation();
  const requested = hash.replace('#ac-', '');
  const active = TABS.find(t => t.key === requested) ?? TABS[0];

  // One request feeds every badge. Nine list calls just to render a tab bar
  // would be nine round trips before the first tab paints.
  const { data: overview } = useQuery({ queryKey: ['admin-overview'], queryFn: fetchAdminOverview });
  const counts = overview?.counts ?? {};

  const Panel = active.Panel;

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-heading text-xl font-extrabold text-[#0B1220]">
          <Wrench className="h-5 w-5 text-brand-600" /> Admin Console
        </h2>
        <p className="text-xs text-slate-400">Signed in as staff · every change here is recorded in the audit log</p>
      </div>

      <nav className="flex flex-wrap gap-2 border-b border-slate-100 pb-4">
        {TABS.map(t => {
          const isActive = t.key === active.key;
          const n = t.count ? counts[t.count] : null;
          return (
            <Link key={t.key} to={`#ac-${t.key}`} replace
              aria-current={isActive ? 'page' : undefined}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                isActive ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
              <t.Icon className="h-3.5 w-3.5" />
              {t.label}
              {n != null && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
                  isActive ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-600'}`}>{n}</span>
              )}
            </Link>
          );
        })}
      </nav>

      <Panel overview={overview} />
    </section>
  );
}
