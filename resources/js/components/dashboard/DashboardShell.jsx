import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  LayoutGrid, BookOpen, Award, Trophy, LifeBuoy, CalendarClock, FolderOpen,
  Clock, LogOut, Menu, X, Users, ShieldCheck, Send, AlertCircle,
} from 'lucide-react';
import { fetchMyRecord, fetchMyEnrollments, fetchCourses, fetchTeacherDemos, fetchOnlineAllowance,
  fetchMyCourseMaterials, downloadCourseMaterial,
  fetchHandoverRecipients, sendCourseMaterial, fetchMaterialHandovers, markHandoverSeen } from '../../lib/api.js';
// The console's kit, borrowed rather than re-cut. The recipient picker is a
// modal, and every date on it is a date the admin's handover trail prints too —
// two formatters would eventually disagree about the same delivery.
import { Modal, StatusBadge, errText, day, inp, btnPrimary, btnGhost } from '../admin/AdminUI.jsx';
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
    // "Certificates" used to sit here as its own destination. Nothing could
    // ever appear in it: there is no Certificate model and no endpoint that
    // could fill one, so the section was a permanent "coming soon" card. A
    // certificate already has a real home — a portfolio item of type
    // 'certificate' — so the nav entry is gone rather than kept as a promise.
    { key: 'achievements', label: 'Achievements', Icon: Trophy },
    { key: 'support',      label: 'Help',         Icon: LifeBuoy },
  ],
  parent: [
    { key: 'overview',     label: 'Overview',     Icon: LayoutGrid },
    { key: 'classes',      label: 'Classes',      Icon: BookOpen },
    { key: 'materials',    label: 'Materials',    Icon: FolderOpen },
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
    { key: 'materials',  label: 'Materials',  Icon: FolderOpen },
    { key: 'requests',   label: 'Requests',   Icon: Trophy },
    { key: 'profile',    label: 'My profile', Icon: ShieldCheck },
    // A teacher had no way to reach a human in-product at all. The support
    // endpoints have never been role-restricted.
    { key: 'support',    label: 'Help',       Icon: LifeBuoy },
  ],
};

/** The one line under the greeting. A teacher does not "learn" here. */
const SUBTITLE = {
  student: 'Here is where your learning stands.',
  parent:  "Here is how your children's classes are going.",
  teacher: 'Here is your teaching at a glance.',
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
              {/* Per role. This line was "Here is where your learning stands."
                  for everybody, so a parent and a teacher were both told about
                  "your learning" — the teacher does not learn here, they teach,
                  and the parent is watching someone else's progress. */}
              <p className="text-xs text-slate-500">{SUBTITLE[role] ?? SUBTITLE.student}</p>
            </div>

            {/* /account holds the password change, the sign-in addresses and the
                order receipts, and every one of those endpoints works — but the
                only link to it in the whole app lived in a component that just
                the admin view renders, so all three of these roles were locked
                out of their own account settings. */}
            <Link to="/account"
              className="ml-auto shrink-0 rounded-lg bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50">
              <span className="hidden sm:inline">Account &amp; orders</span>
              <span className="sm:hidden">Account</span>
            </Link>
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
// One endpoint serves all three roles, so the copy has to change voice: a
// teacher is not "enrolled in" the class they teach, and a parent's materials
// arrive through their child.
//
// `sent` / `sentBlurb` name the SECOND way a file can arrive: a teacher picked
// it out and handed it over. That is a promise from a person, where a course
// group is an entitlement that came with the purchase — so the two are never
// merged into one list.
const MATERIALS_COPY = {
  student: {
    blurb: 'Notes, slides and worksheets for the classes you are enrolled in.',
    empty: 'Nothing shared yet. Material appears here once you are enrolled in a class and your teacher or our team publishes it.',
    sent: 'Sent to you by your teacher',
    sentBlurb: 'Your teacher picked these out and sent them to you.',
    courseTitle: 'From your classes',
  },
  parent: {
    blurb: "Notes, slides and worksheets for the classes your children are enrolled in.",
    empty: "Nothing shared yet. Material appears here once a child is enrolled and their teacher or our team publishes it.",
    sent: 'Sent by a teacher',
    sentBlurb: 'Files a teacher sent to a child on your account, and whether they have been opened yet.',
    courseTitle: "From your children's classes",
  },
  teacher: {
    blurb: 'Notes, slides and worksheets published for the courses you teach. Send any of them on to a student you teach.',
    empty: 'Nothing published yet for your courses. Company material our team uploads appears here, ready to send on.',
    sent: 'Sent to you',
    sentBlurb: 'Files someone handed to you directly.',
    courseTitle: 'From your courses',
  },
};

/**
 * One vocabulary for delivery state, so the teacher's copy of a row and the
 * family's copy can never describe the same handover differently. The tones are
 * the console's own status words, which is why "sent" borrows `pending`: the
 * file is waiting on the reader, not finished with.
 */
const handoverState = (h) => {
  if (h?.downloaded_at) return { tone: 'completed', label: 'Downloaded' };
  if (h?.first_viewed_at) return { tone: 'scheduled', label: 'Opened' };
  return { tone: 'pending', label: 'Not opened yet' };
};

// A row is one DELIVERY, not one file: a guardian with two children who were
// each sent the same deck gets two rows carrying the same material id. Keying
// React — and the download spinner — on the material alone would collide them,
// so anything that identifies a row goes through here.
const rowKey = (m) => (m.handover ? `h${m.handover.id}` : `m${m.id}`);

export function ClassMaterialsSection({ children, audience = 'student' }) {
  const copy = MATERIALS_COPY[audience] ?? MATERIALS_COPY.student;
  const qc = useQueryClient();
  const { data: groups = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['my-course-materials'],
    queryFn: fetchMyCourseMaterials,
  });

  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState('');
  const [sendFor, setSendFor] = useState(null);   // teacher only

  // The endpoint groups by course AND adds a group for handed-over material, so
  // one file can legitimately arrive twice: the course entitles the reader to it
  // and a teacher also sent it. Splitting on the `handover` object rather than on
  // which group a row came in means it is listed once, under the promise that
  // actually explains why it is there.
  //
  // Two sets, because the two questions differ. The handed list is deduplicated
  // per HANDOVER: the server sends one entry per delivery so a guardian sees a
  // row per child, and folding those onto the material id silently deleted the
  // second child's whole delivery record. The course groups still drop by
  // MATERIAL id — that is the "listed once" rule above, and it is about the file.
  const handed = [];
  const handedIds = new Set();
  const handedMaterialIds = new Set();
  groups.forEach(g => (g.materials ?? []).forEach(m => {
    if (!m.handover || handedIds.has(m.handover.id)) return;
    handedIds.add(m.handover.id);
    handedMaterialIds.add(m.id);
    handed.push({ ...m, course: m.course ?? g.course });
  }));
  const courseGroups = groups
    .map(g => ({ course: g.course, materials: (g.materials ?? []).filter(m => !handedMaterialIds.has(m.id)) }))
    .filter(g => g.materials.length);
  const total = handed.length + courseGroups.reduce((a, g) => a + g.materials.length, 0);

  // Opening a handed-over file is what tells the teacher it landed. Only the
  // recipient's own reading counts, and the SERVER decides who that is — it
  // stamps only when the caller is the addressee. Gating this on the student
  // role instead was wrong for the case it matters most in: where a child has
  // no login the send is addressed to the guardian, so the guardian's open is
  // the genuine receipt, and refusing to report it left those handovers reading
  // "not opened yet" forever.
  const ack = async (m) => {
    if (!m.handover || m.handover.first_viewed_at) return;
    try {
      await markHandoverSeen(m.handover.id);
      qc.invalidateQueries({ queryKey: ['my-course-materials'] });
    } catch { /* the file opened; a missed read-receipt is not worth an error */ }
  };

  const get = async (m) => {
    setBusy(rowKey(m)); setErr('');
    try {
      await downloadCourseMaterial(m.id, m.title);
      await ack(m);
    } catch (e) {
      setErr(errText(e, 'That file would not open just now — please try again.'));
    } finally { setBusy(null); }
  };

  const rowProps = { audience, busy, onGet: get, onOpen: ack,
    onSend: audience === 'teacher' ? setSendFor : null };

  return (
    <>
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
        <h2 className="font-heading flex items-center gap-2 text-lg font-bold text-[#0B1220]">
          <FolderOpen className="h-5 w-5 text-brand-600" />Class materials
        </h2>
        <p className="mt-1 text-xs text-slate-500">{copy.blurb}</p>

        {/* Three outcomes, three different sentences. "Nothing yet" is the normal
            first view on this platform and has to read as calm and finished;
            a failed request has to read as something that can be retried. */}
        {isLoading ? (
          <p className="mt-3 text-sm text-slate-400">Loading…</p>
        ) : isError ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="min-w-0">We could not load your materials just now.</span>
            <button type="button" onClick={() => refetch()} className="font-bold underline hover:no-underline">Try again</button>
          </div>
        ) : total === 0 ? (
          <p className="mt-3 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-500 ring-1 ring-slate-100">
            {copy.empty}
          </p>
        ) : (
          <>
            {err && (
              <p className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 ring-1 ring-red-100">{err}</p>
            )}

            {handed.length > 0 && (
              <div className="mt-4 rounded-xl bg-brand-50/60 p-3 ring-1 ring-brand-100 sm:p-4">
                <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-brand-800">
                  <Send className="h-3.5 w-3.5 shrink-0" />{copy.sent}
                </p>
                <p className="mt-0.5 text-xs text-brand-900/70">{copy.sentBlurb}</p>
                <ul className="mt-2.5 space-y-1.5">
                  {handed.map(m => <MaterialRow key={rowKey(m)} m={m} {...rowProps} />)}
                </ul>
              </div>
            )}

            {courseGroups.length > 0 && (
              <div className="mt-4 space-y-5">
                {/* Only worth a heading once there is a second kind of arrival to
                    tell it apart from. */}
                {handed.length > 0 && (
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{copy.courseTitle}</p>
                )}
                {courseGroups.map((g, i) => (
                  // Indexed fallback: a material whose enrolment has no course
                  // (the normal state of the one enrolment in this database)
                  // groups under a null course, and two of those would collide
                  // on a shared literal key.
                  <div key={g.course?.id ?? `ungrouped-${i}`}>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{g.course?.name || 'Your classes'}</p>
                    <ul className="mt-2 space-y-1.5">
                      {g.materials.map(m => <MaterialRow key={rowKey(m)} m={m} {...rowProps} />)}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {/* Video courses, when the learner owns any — this hides itself. */}
      {children}

      {sendFor && <SendMaterialModal material={sendFor} onClose={() => setSendFor(null)} />}
    </>
  );
}

/**
 * One row, three roles. A parent never gets the send control and a student never
 * sees another child's name — both of those come from `audience`, not from what
 * happens to be in the payload, so a widened endpoint could not quietly turn a
 * reader into a sender.
 */
function MaterialRow({ m, audience, busy, onGet, onOpen, onSend }) {
  const h = m.handover;
  const st = h ? handoverState(h) : null;
  // Per delivery, not per file, or a guardian downloading one child's copy would
  // put the sibling's row into "Opening…" as well.
  const busyNow = busy === rowKey(m);
  // "New" is the student's own unread marker. A parent has not been sent
  // anything, so nothing is new to them.
  const isNew = h && !h.first_viewed_at && audience === 'student';

  return (
    <li className={`flex flex-wrap items-center gap-2 rounded-lg px-3 py-2 ring-1 ${h ? 'bg-white ring-brand-200' : 'ring-slate-100'}`}>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-1.5">
          <span className="min-w-0 max-w-full truncate text-sm font-semibold text-slate-800">{m.title}</span>
          {isNew && <span className="rounded-full bg-brand-600 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">New</span>}
        </span>
        {m.description && <span className="block truncate text-xs text-slate-500">{m.description}</span>}

        {h && (
          <span className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-brand-800">
            <Send className="h-3 w-3 shrink-0" />
            <span className="font-semibold">
              {audience === 'parent' && h.student ? `Sent to ${h.student}` : 'Sent to you'}
              {h.sent_by ? ` by ${h.sent_by}` : ''}
            </span>
            <span className="text-brand-700/70">· {day(h.sent_at)}</span>
            {/* The teacher already sees this state in their own panel; showing it
                back to the student would be telling them what they just did. It
                is the parent who is watching. */}
            {audience === 'parent' && <StatusBadge status={st.tone}>{st.label}</StatusBadge>}
            {audience === 'parent' && h.download_count > 0 && (
              <span className="text-slate-500">{h.download_count}× downloaded</span>
            )}
          </span>
        )}
        {h?.note && <span className="mt-0.5 block text-xs italic text-slate-500">“{h.note}”</span>}
      </span>

      {m.type && <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-500">{m.type}</span>}

      {onSend && (
        <button type="button" onClick={() => onSend(m)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-brand-700 ring-1 ring-brand-200 hover:bg-brand-50">
          <Send className="h-3.5 w-3.5" />Send to student
        </button>
      )}

      {m.has_file ? (
        <button onClick={() => onGet(m)} disabled={busyNow}
          className="shrink-0 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-700 disabled:opacity-60">
          {busyNow ? 'Opening…' : 'Download'}
        </button>
      ) : m.link_url ? (
        <a href={m.link_url} target="_blank" rel="noopener noreferrer" onClick={() => onOpen(m)}
          className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold text-brand-700 ring-1 ring-brand-200 hover:bg-brand-50">
          Open ↗
        </a>
      ) : null}
    </li>
  );
}

/**
 * The teacher's half of the hop: hand one file to the students they teach.
 *
 * The recipient list is the teacher's OWN active enrolments — the server decides
 * that, and rejects the whole request if a student on it is not theirs, so this
 * cannot reach a family the teacher does not teach even if the list were stale.
 *
 * Sending the same file to the same student twice is deliberately harmless: the
 * server updates the existing ledger row rather than writing a second one, which
 * is what keeps "does this student have this file" an answerable question.
 */
function SendMaterialModal({ material, onClose }) {
  // Keyed on the material, because already_sent is an answer ABOUT this file —
  // a roster cached without one would report "not sent yet" for every student.
  const recipients = useQuery({
    queryKey: ['handover-recipients', material.id],
    queryFn: () => fetchHandoverRecipients(material.id),
  });
  const handovers  = useQuery({ queryKey: ['material-handovers', material.id], queryFn: () => fetchMaterialHandovers(material.id) });

  const [picked, setPicked] = useState([]);
  const [note, setNote] = useState('');
  const [result, setResult] = useState(null);

  const rows = recipients.data ?? [];
  const sentRows = handovers.data ?? [];

  const send = useMutation({
    mutationFn: () => sendCourseMaterial(material.id, { student_ids: picked, note: note.trim() || null }),
    onSuccess: (r) => {
      setResult(r); setPicked([]); setNote('');
      handovers.refetch();
      recipients.refetch();
    },
  });

  const toggle = (id) => setPicked(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const nameFor = (id) => rows.find(r => r.student_id === id)?.name ?? `Student #${id}`;

  // The server answers this per student id, now that the roster is fetched for
  // this material. It used to fall back to matching the ledger by NAME, which
  // flagged both of two students called Ravi the moment either was sent the file.
  const wasSent = (r) => r.already_sent === true;

  return (
    <Modal wide title="Send to a student" subtitle={material.title} onClose={onClose}>
      <div className="max-h-[45vh] overflow-y-auto pr-0.5">
        {recipients.isLoading ? (
          <p className="py-6 text-center text-sm text-slate-400">Loading your students…</p>
        ) : recipients.isError ? (
          <div className="flex flex-wrap items-center gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700 ring-1 ring-red-100">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="min-w-0">We could not load your students.</span>
            <button type="button" onClick={() => recipients.refetch()} className="font-bold underline hover:no-underline">Try again</button>
          </div>
        ) : !rows.length ? (
          <p className="rounded-lg bg-slate-50 px-3 py-2.5 text-sm text-slate-500 ring-1 ring-slate-100">
            You have no active students yet. Once a demo is converted to an enrolment, the students you
            teach appear here and you can send them material.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {rows.map(r => (
              <li key={r.student_id}>
                <label className="flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2.5 ring-1 ring-slate-100 hover:bg-slate-50">
                  <input type="checkbox" checked={picked.includes(r.student_id)} onChange={() => toggle(r.student_id)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded ring-1 ring-slate-300 accent-brand-600" />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span className="min-w-0 max-w-full truncate text-sm font-semibold text-slate-800">{r.name}</span>
                      {wasSent(r) && (
                        <span className="rounded-full bg-green-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-green-700">Already sent</span>
                      )}
                    </span>
                    <span className="block truncate text-xs text-slate-500">{r.course || 'Class not named yet'}</span>
                    {/* Never hidden. Without a login of their own the file lands in
                        the guardian's account, and a teacher who thinks they sent
                        it to the child has been told something untrue. */}
                    {r.has_own_login === false && (
                      <span className="mt-1 block rounded bg-amber-50 px-2 py-1 text-[11px] font-semibold leading-snug text-amber-800">
                        Goes to the parent's account — this student has no login yet.
                      </span>
                    )}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>

      {rows.length > 0 && (
        <div className="mt-3">
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-slate-600">Note (optional)</span>
            <input value={note} maxLength={300} onChange={e => setNote(e.target.value)}
              placeholder="e.g. Read pages 4–9 before Thursday" className={inp} />
          </label>
        </div>
      )}

      {send.isError && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-100">{errText(send.error)}</p>
      )}

      {result && (
        <>
          <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm font-semibold text-green-800 ring-1 ring-green-100">
            Sent to {result.sent} {result.sent === 1 ? 'student' : 'students'}.
          </p>
          {result.skipped?.length > 0 && (
            <ul className="mt-2 space-y-1 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900 ring-1 ring-amber-100">
              {result.skipped.map(s => <li key={s.student_id}><b>{nameFor(s.student_id)}</b> — {s.reason}</li>)}
            </ul>
          )}
        </>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => send.mutate()} disabled={!picked.length || send.isPending}
          className={btnPrimary}>
          <Send className="h-4 w-4" />
          {send.isPending ? 'Sending…' : picked.length ? `Send to ${picked.length}` : 'Send'}
        </button>
        <button type="button" onClick={onClose} className={btnGhost}>Close</button>
      </div>

      {/* Who already has it, and what they did with it. Loaded whether or not
          anything was just sent — "I sent this last week, did they open it?" is
          the same question. */}
      <div className="mt-5 border-t border-slate-100 pt-4">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Already sent to</p>
        {handovers.isLoading ? (
          <p className="mt-2 text-sm text-slate-400">Loading…</p>
        ) : handovers.isError ? (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>We could not load who has this yet.</span>
            <button type="button" onClick={() => handovers.refetch()} className="font-bold underline hover:no-underline">Try again</button>
          </div>
        ) : !sentRows.length ? (
          <p className="mt-2 text-sm text-slate-500">Nobody yet — nothing has been sent from this file.</p>
        ) : (
          // Capped: the picker above already scrolls, and an uncapped ledger
          // under it is what pushes a centred modal off the top of a laptop.
          <ul className="mt-2 max-h-[30vh] space-y-1.5 overflow-y-auto pr-0.5">
            {sentRows.map((h, i) => {
              const st = handoverState(h);
              return (
                <li key={h.id ?? `${h.student}-${h.sent_at}-${i}`}
                  className="flex flex-wrap items-center gap-2 rounded-lg px-3 py-2 ring-1 ring-slate-100">
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800">{h.student || 'Student'}</span>
                  <span className="text-xs text-slate-500">{day(h.sent_at)}</span>
                  <StatusBadge status={st.tone}>{st.label}</StatusBadge>
                  {h.download_count > 0 && <span className="text-[11px] text-slate-400">{h.download_count}×</span>}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Modal>
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
    // .data, because /courses is PAGINATED — fetchCourses hands back the whole
    // {data, links, meta} envelope. Reading .length off the envelope gave
    // undefined, so the guard below fired every single time and this section
    // has never rendered for any student since it was written. Every other
    // caller in the app unwraps it; this one did not.
    queryFn: () => fetchCourses({ per_page: 3 }).then(r => r?.data ?? []),
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
