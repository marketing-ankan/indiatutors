import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutGrid, BookOpen, Award, Trophy, LifeBuoy, CalendarClock, FolderOpen,
  Clock, LogOut, Menu, X, Users, ShieldCheck,
} from 'lucide-react';
import { fetchMyRecord, fetchMyEnrollments, fetchCourses, fetchTeacherDemos, fetchOnlineAllowance,
  fetchMyCourseMaterials, downloadCourseMaterial } from '../../lib/api.js';
import { useAuth } from '../../lib/auth.jsx';

/**
 * The student dashboard, in the shape of the reference the owner supplied:
 * left nav, a wide "keep learning" column, and a stats rail on the right.
 *
 * TWO DELIBERATE DEPARTURES FROM THE REFERENCE.
 *
 * 1. COLOUR. The reference is orange; this is IndiaTutors blue/navy with gold
 *    accents, per the owner's instruction and the parity work already done.
 *
 * 2. EVERY NUMBER IS REAL. The reference shows "560 Points", "40 Days Streak"
 *    and "1st Place" on a leaderboard. This platform has no points, no streak
 *    and no leaderboard, and putting motivating numbers on a child's screen
 *    that mean nothing is the exact habit that had to be scrubbed out of this
 *    site in August. Those slots are filled with what a family actually has:
 *    classes attended, hours taught, and the week's real attendance. Where
 *    there is no true equivalent — "points" — the tile simply is not there.
 *
 * Full width at every size: the shell owns its own padding and stretches, so a
 * 2560px monitor is not showing a 1024px column in the middle of the screen.
 */

/**
 * Nav per role. Kept here rather than passed in, so the three dashboards
 * cannot drift into three different navigation idioms.
 */
export const NAV_BY_ROLE = {
  student: [
    { key: 'overview',     label: 'Overview',     Icon: LayoutGrid },
    { key: 'classes',      label: 'My classes',   Icon: BookOpen },
    { key: 'materials',    label: 'Materials',    Icon: FolderOpen },
    { key: 'achievements', label: 'Achievements', Icon: Trophy },
    { key: 'certificates', label: 'Certificates', Icon: Award },
    { key: 'support',      label: 'Help',         Icon: LifeBuoy },
  ],
  parent: [
    { key: 'overview',     label: 'Overview',     Icon: LayoutGrid },
    { key: 'classes',      label: 'Classes',      Icon: BookOpen },
    { key: 'bookings',     label: 'Bookings',     Icon: CalendarClock },
    { key: 'achievements', label: 'Achievements', Icon: Trophy },
    { key: 'children',     label: 'My children',  Icon: Users },
    { key: 'account',      label: 'Account',      Icon: ShieldCheck },
    { key: 'support',      label: 'Help',         Icon: LifeBuoy },
  ],
  teacher: [
    { key: 'overview',   label: 'Overview',   Icon: LayoutGrid },
    { key: 'classroom',  label: 'Classroom',  Icon: BookOpen },
    { key: 'schedule',   label: 'Schedule',   Icon: CalendarClock },
    { key: 'requests',   label: 'Requests',   Icon: Trophy },
    { key: 'profile',    label: 'My profile', Icon: ShieldCheck },
  ],
};

export default function DashboardShell({ role = 'student', section, onSection, children, rail }) {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const NAV = NAV_BY_ROLE[role] ?? NAV_BY_ROLE.student;

  return (
    <div className="min-h-screen bg-[#F5F7FB]">
      <div className="flex w-full">
        {/* SIDEBAR — a drawer under lg, a sticky rail from lg up. */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-64 shrink-0 transform bg-[#0B1220] p-4 transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0
            ${open ? 'translate-x-0' : '-translate-x-full'}`}
          aria-label="Dashboard sections"
        >
          <div className="mb-6 flex items-center justify-between">
            <Link to="/" className="font-heading text-lg font-extrabold text-white">
              Indiatutors<span className="text-[#D4AF37]">.</span>
            </Link>
            <button onClick={() => setOpen(false)} className="text-white/70 lg:hidden" aria-label="Close menu">
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="space-y-1">
            {NAV.map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => { onSection(key); setOpen(false); }}
                aria-current={section === key ? 'page' : undefined}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition
                  ${section === key ? 'bg-brand-600 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
              >
                <Icon className="h-4 w-4 shrink-0" />{label}
              </button>
            ))}
          </nav>

          <button onClick={logout}
            className="mt-6 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-white/60 hover:bg-white/10 hover:text-white">
            <LogOut className="h-4 w-4" />Log out
          </button>
        </aside>

        {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} aria-hidden="true" />}

        {/* MAIN — min-w-0 so a wide table or chart inside can never push the
            whole layout sideways, which is the classic flex overflow bug. */}
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-5 flex items-center gap-3">
            <button onClick={() => setOpen(true)} className="rounded-lg bg-white p-2 text-slate-600 shadow-sm ring-1 ring-slate-200 lg:hidden" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h1 className="font-heading truncate text-xl font-extrabold text-[#0B1220] sm:text-2xl">
                Hello, {user?.name?.split(' ')[0] || 'there'} 👋
              </h1>
              <p className="text-xs text-slate-500">Here is where your learning stands.</p>
            </div>
          </div>

          {/* 2xl, not lg: the rail only earns its place once the main column
              still has room to breathe beside it. */}
          <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="min-w-0 space-y-6">{children}</div>
            {/* Each role brings its own rail. A teacher's numbers are not a
                student's, and one rail trying to serve both would show every
                role a column of blanks. */}
            {rail ?? <StatsRail />}
          </div>
        </main>
      </div>
    </div>
  );
}

/** The right-hand rail: who you are, this week, and the last six weeks. */
function StatsRail() {
  const { user } = useAuth();
  const { data: records = [] } = useQuery({ queryKey: ['my-record'], queryFn: fetchMyRecord });
  const r = records[0];

  if (!r) return <aside className="hidden 2xl:block" aria-hidden="true" />;

  const maxHours = Math.max(1, ...r.recent_weeks.map(w => w.hours));

  return (
    <aside className="space-y-4 2xl:sticky 2xl:top-6 2xl:self-start">
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-600 font-heading text-lg font-extrabold text-white">
            {(r.student.name || 'S').slice(0, 1)}
          </span>
          <div className="min-w-0">
            <p className="truncate font-bold text-[#0B1220]">{r.student.name}</p>
            <p className="text-xs text-slate-500">{r.student.grade || 'Student'} · {user?.email}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Tile value={r.classes.attended} label="Classes attended" />
          <Tile value={r.classes.hours} label="Hours taught" />
          <Tile value={r.enrollments.active} label="Active classes" />
          <Tile value={r.materials.total} label="Materials" />
        </div>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
        <p className="text-sm font-bold text-[#0B1220]">This week</p>
        <p className="mt-0.5 text-xs text-slate-500">Days a class was actually held.</p>
        <ul className="mt-3 flex justify-between gap-1">
          {r.week.map(d => (
            <li key={d.date} className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-semibold uppercase text-slate-400">{d.label}</span>
              <span
                title={d.date}
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold
                  ${d.attended ? 'bg-brand-600 text-white' : d.future ? 'bg-slate-50 text-slate-300' : 'bg-slate-100 text-slate-400'}`}
              >
                {d.attended ? '✓' : '·'}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
        <p className="flex items-center gap-1.5 text-sm font-bold text-[#0B1220]">
          <Clock className="h-4 w-4 text-brand-600" />Class hours
        </p>
        <p className="mt-0.5 text-xs text-slate-500">Last six weeks.</p>
        <ul className="mt-3 flex h-24 items-end justify-between gap-1.5">
          {r.recent_weeks.map(w => (
            <li key={w.label} className="flex flex-1 flex-col items-center gap-1" title={`${w.label}: ${w.hours}h`}>
              <span
                className={`w-full rounded-t ${w.hours > 0 ? 'bg-brand-600' : 'bg-slate-100'}`}
                style={{ height: `${Math.max(4, (w.hours / maxHours) * 72)}px` }}
              />
              <span className="text-[9px] text-slate-400">{w.label.split(' ')[0]}</span>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}

/**
 * Parent rail — the household at a glance, summed across every child on the
 * account. Same counted figures as a student sees, so a parent and their child
 * can never be looking at two different truths.
 */
export function ParentRail() {
  const { data: records = [] } = useQuery({ queryKey: ['my-record'], queryFn: fetchMyRecord });
  const { data: enrolments = [] } = useQuery({ queryKey: ['my-enrollments'], queryFn: fetchMyEnrollments });
  if (!records.length) return <aside className="hidden 2xl:block" aria-hidden="true" />;

  const sum = k => records.reduce((a, r) => a + k(r), 0);

  return (
    <aside className="space-y-4 2xl:sticky 2xl:top-6 2xl:self-start">
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
        <p className="text-sm font-bold text-[#0B1220]">Your household</p>
        <p className="mt-0.5 text-xs text-slate-500">Counted across {records.length} {records.length === 1 ? 'child' : 'children'}.</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Tile value={sum(r => r.classes.attended)} label="Classes attended" />
          <Tile value={sum(r => r.classes.hours)} label="Hours taught" />
          <Tile value={enrolments.filter(e => e.status === 'active').length} label="Active classes" />
          <Tile value={sum(r => r.achievements.total)} label="Achievements" />
        </div>
      </section>

      {records.map(r => (
        <section key={r.student.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <p className="truncate text-sm font-bold text-[#0B1220]">{r.student.name}</p>
          <p className="mt-0.5 text-xs text-slate-500">{r.student.grade || 'Student'}</p>
          <ul className="mt-3 flex justify-between gap-1">
            {r.week.map(d => (
              <li key={d.date} className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-semibold uppercase text-slate-400">{d.label}</span>
                <span title={d.date}
                  className={`flex h-7 w-7 items-center justify-center rounded-lg text-[11px] font-bold
                    ${d.attended ? 'bg-brand-600 text-white' : d.future ? 'bg-slate-50 text-slate-300' : 'bg-slate-100 text-slate-400'}`}>
                  {d.attended ? '✓' : '·'}
                </span>
              </li>
            ))}
          </ul>
          {r.classes.missed > 0 && (
            <p className="mt-2 text-xs text-slate-500">{r.classes.missed} missed{r.substitutions > 0 && ` · ${r.substitutions} covered by a substitute`}</p>
          )}
        </section>
      ))}
    </aside>
  );
}

/**
 * Teacher rail — what a teacher needs at a glance: the work waiting on them,
 * and how much of their monthly online allowance is left (E9). Deliberately NO
 * conversion rate or ranking score: those are management figures, and putting a
 * teacher's own score in front of them turns a matching signal into a
 * performance review nobody agreed to.
 */
export function TeacherRail() {
  const { data: demos = [] } = useQuery({ queryKey: ['teacher-demos'], queryFn: fetchTeacherDemos });
  const { data: allowance } = useQuery({ queryKey: ['online-allowance'], queryFn: fetchOnlineAllowance });

  const awaiting = demos.filter(d => ['new', 'contacted'].includes(d.status)).length;
  const scheduled = demos.filter(d => d.status === 'scheduled').length;

  return (
    <aside className="space-y-4 2xl:sticky 2xl:top-6 2xl:self-start">
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
        <p className="text-sm font-bold text-[#0B1220]">Waiting on you</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Tile value={awaiting} label="Demos to arrange" />
          <Tile value={scheduled} label="Demos scheduled" />
        </div>
        {awaiting > 0 && (
          <p className="mt-2 text-xs text-slate-500">Propose a time from the Classroom section — the family confirms it.</p>
        )}
      </section>

      {allowance?.eligible && (
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <p className="flex items-center gap-1.5 text-sm font-bold text-[#0B1220]">
            <Clock className="h-4 w-4 text-brand-600" />Online classes this month
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            You may take {allowance.allowed} of your {allowance.required} classes online.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-brand-600"
                style={{ width: `${allowance.allowed ? Math.min(100, (allowance.used / allowance.allowed) * 100) : 0}%` }} />
            </div>
            <span className="text-xs font-bold tabular-nums text-[#0B1220]">{allowance.remaining} left</span>
          </div>
        </section>
      )}
    </aside>
  );
}

const Tile = ({ value, label }) => (
  <div className="rounded-xl bg-[#F5F7FB] px-3 py-2.5 text-center">
    <div className="font-heading text-lg font-extrabold text-brand-600">{value}</div>
    <div className="mt-0.5 text-[10px] uppercase leading-tight tracking-wide text-slate-500">{label}</div>
  </div>
);

/**
 * "Keep learning" — the reference's progress cards, filled with the only
 * progress this platform genuinely tracks: the class timetable and what has
 * been taught so far. No invented completion percentages.
 */
export function KeepLearning() {
  const { data: items = [], isLoading } = useQuery({ queryKey: ['my-enrollments'], queryFn: fetchMyEnrollments });
  const active = items.filter(e => e.status === 'active');

  if (isLoading) return <p className="text-sm text-slate-400">Loading your classes…</p>;
  if (!active.length) {
    return (
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
        <h2 className="font-heading text-lg font-bold text-[#0B1220]">Keep learning</h2>
        <p className="mt-1 text-sm text-slate-500">
          No active classes yet. Once you finish a demo and enrol, your classes appear here.
        </p>
        <Link to="/find-tutors" className="mt-3 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700">
          Find a tutor
        </Link>
      </section>
    );
  }

  return (
    <section>
      <h2 className="font-heading mb-3 text-lg font-bold text-[#0B1220]">Keep learning</h2>
      {/* grid-cols-1 is NOT redundant. Tailwind's `grid` only sets display:grid;
          with no template below sm the implicit column is `auto`, which sizes to
          MAX-content — a long course name then pushed this card to 585px inside
          a 360px phone and scrolled the whole page sideways. grid-cols-1 is
          repeat(1, minmax(0,1fr)), which clamps. */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {active.map(e => (
          <article key={e.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50">
                <BookOpen className="h-4 w-4 text-brand-600" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-bold text-[#0B1220]">{e.course?.name || e.plan || 'Your class'}</p>
                <p className="truncate text-xs text-slate-500">{e.tutor?.name ? `with ${e.tutor.name}` : 'Teacher to be assigned'}</p>
              </div>
            </div>
            {e.schedule?.length > 0 ? (
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {e.schedule.map(s => (
                  <li key={s.id} className="flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700">
                    <CalendarClock className="h-3 w-3" />{s.label}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-xs text-slate-500">Timetable not set yet — your coordinator will confirm it.</p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

/**
 * E3 + E4 — the company material for the courses you are enrolled in, plus any
 * video courses you own.
 *
 * This section used to render `MyCoursesCard` alone, which returns null when a
 * learner owns no video courses — so the whole Materials page came up
 * completely blank, with a sidebar item promising something and a void beside
 * it. A card that hides itself is fine inside a stack of other cards; as the
 * only child of a section it is a bug.
 *
 * It also surfaces the company decks, which existed only as an API until now.
 */
export function ClassMaterialsSection({ children }) {
  const { data: groups = [], isLoading } = useQuery({
    queryKey: ['my-course-materials'],
    queryFn: fetchMyCourseMaterials,
  });

  const [busy, setBusy] = useState(null);
  const total = groups.reduce((a, g) => a + g.materials.length, 0);

  const get = async (m) => {
    setBusy(m.id);
    try { await downloadCourseMaterial(m.id, m.title); } finally { setBusy(null); }
  };

  return (
    <>
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
        <h2 className="font-heading flex items-center gap-2 text-lg font-bold text-[#0B1220]">
          <FolderOpen className="h-5 w-5 text-brand-600" />Class materials
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Notes, slides and worksheets for the classes you are enrolled in.
        </p>

        {isLoading ? (
          <p className="mt-3 text-sm text-slate-400">Loading…</p>
        ) : total === 0 ? (
          <p className="mt-3 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-500 ring-1 ring-slate-100">
            Nothing shared yet. Material appears here once you are enrolled in a class and your teacher
            or our team publishes it.
          </p>
        ) : (
          <div className="mt-4 space-y-5">
            {groups.map(g => (
              <div key={g.course?.id ?? 'x'}>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{g.course?.name}</p>
                <ul className="mt-2 space-y-1.5">
                  {g.materials.map(m => (
                    <li key={m.id} className="flex flex-wrap items-center gap-2 rounded-lg px-3 py-2 ring-1 ring-slate-100">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-slate-800">{m.title}</span>
                        {m.description && <span className="block truncate text-xs text-slate-500">{m.description}</span>}
                      </span>
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-500">{m.type}</span>
                      {m.has_file ? (
                        <button onClick={() => get(m)} disabled={busy === m.id}
                          className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-700 disabled:opacity-60">
                          {busy === m.id ? 'Opening…' : 'Download'}
                        </button>
                      ) : m.link_url ? (
                        <a href={m.link_url} target="_blank" rel="noopener noreferrer"
                          className="rounded-lg px-3 py-1.5 text-xs font-bold text-brand-700 ring-1 ring-brand-200 hover:bg-brand-50">
                          Open ↗
                        </a>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Video courses, when the learner owns any — this hides itself. */}
      {children}
    </>
  );
}

/**
 * "Suggested for you" — real published courses, not a fabricated recommender.
 * Labelled "Popular right now" rather than "picked for you", because nothing
 * here is personalised yet and saying otherwise would be a small lie.
 */
export function SuggestedCourses() {
  const { data: courses = [] } = useQuery({
    queryKey: ['dash-popular-courses'],
    queryFn: () => fetchCourses({ per_page: 3 }),
    staleTime: 600_000,
  });
  if (!courses.length) return null;

  return (
    <section>
      <h2 className="font-heading mb-3 text-lg font-bold text-[#0B1220]">Popular right now</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {courses.slice(0, 3).map(c => (
          <Link key={c.id} to={`/courses/${c.slug}`}
            className="group rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 transition hover:ring-brand-300">
            <p className="line-clamp-2 font-bold text-[#0B1220] group-hover:text-brand-700">{c.name}</p>
            <p className="mt-2 text-sm font-extrabold text-brand-600">
              {c.price ? `₹${Number(c.price).toLocaleString('en-IN')}` : 'Enquire'}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
