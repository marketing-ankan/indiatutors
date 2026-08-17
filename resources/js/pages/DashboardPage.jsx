import { useState, useRef, lazy, Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Trash2, Upload, ShieldCheck, UserPlus, FileText, CalendarClock, GraduationCap, Briefcase, Save, Users, BookOpen, NotebookPen, ChevronDown, ChevronUp, ListChecks, FolderOpen, Link2, Download, Lightbulb, Calendar, Award, Megaphone, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import DashboardHero from '../components/dashboard/DashboardHero.jsx';
import SupportCard from '../components/dashboard/SupportCard.jsx';
// Password, sign-in addresses and order receipts. All three endpoints have
// always worked; nothing outside the admin view ever rendered them.
import AccountSettingsCard from '../components/AccountSettingsCard.jsx';
import MyOrdersCard from '../components/MyOrdersCard.jsx';
import PhysicalProfileCard from '../components/physical/PhysicalProfileCard.jsx';
import TuitionRequirementsCard from '../components/physical/TuitionRequirementsCard.jsx';

// Split out: only admins ever render it, and it is a large chunk to hand to
// every other visitor.
const AdminConsole = lazy(() => import('../components/admin/AdminConsole.jsx'));
import {
  fetchStudents, createStudent, deleteStudent,
  fetchKyc, uploadKyc, deleteKyc, fetchMyDemoRequests, fetchMyEnrollments,
  acceptDemoSlot, declineDemoSlot,
  fetchMyAchievements, createMyAchievement, updateMyAchievement, fetchMyRecord,
} from '../lib/api.js';
import DashboardShell, { KeepLearning, SuggestedCourses, ParentRail, TeacherRail, ClassMaterialsSection } from '../components/dashboard/DashboardShell.jsx';
import {
  fetchTeacherProfile, updateTeacherProfile,
  fetchTeacherStudents, fetchTeacherDemos, fetchClassLogs, addClassLog,
  fetchCurriculum, addCurriculumItem, updateCurriculumItem, deleteCurriculumItem,
  fetchMaterials, uploadMaterial, deleteMaterial, downloadMaterial,
  fetchMyProposals, submitProposal, fetchMyEnrollmentDetail,
  requestReschedule, fetchTeacherReschedules, decideReschedule,
  fetchTeacherCalendar, fetchPortfolio, addPortfolioItem, deletePortfolioItem, downloadPortfolioItem,
  fetchExamUpdates, fetchUpcomingClasses, fetchMyVideoCourses,
} from '../lib/api.js';

const inp = "w-full rounded-md ring-1 ring-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500";

/**
 * /dashboard is role-aware. Before this it rendered the parent view for
 * everybody except teachers — so an admin's own dashboard offered to add their
 * children and upload their Aadhaar, and a student saw a page about managing
 * other students.
 *
 * Each role now gets a view built from the cards that role can actually act on.
 * An admin lands on the staff console (the same component /admin renders), so
 * there is one console to maintain rather than two.
 */
const VIEW_BY_ROLE = {
  admin:   AdminDashboard,
  teacher: TeacherDashboard,
  student: StudentDashboard,
  parent:  ParentDashboard,
};

export default function DashboardPage() {
  const { user, isAuthed, isLoading } = useAuth();

  if (isLoading) return <div className="mx-auto max-w-5xl px-4 py-20 text-slate-500">Loading your dashboard…</div>;
  if (!isAuthed) return <Navigate to="/login" replace />;

  // Student, parent and teacher each own their whole page now — sidebar,
  // padding and full-bleed width live in DashboardShell. Only the admin
  // console still renders inside the centred wrapper below, because it has
  // its own tab chrome and was never the thing being squeezed.
  const Owned = { student: StudentDashboard, parent: ParentDashboard, teacher: TeacherDashboard }[user.role];
  if (Owned) return <Owned />;

  const View = VIEW_BY_ROLE[user.role] ?? ParentDashboard;
  const width = 'max-w-[1600px]';

  return (
    <div className={`mx-auto w-full ${width} px-4 sm:px-6 lg:px-8 py-10`}>
      <DashboardHero />
      <div className="mt-6">
        <View />
      </div>
    </div>
  );
}

function AdminDashboard() {
  return (
    <Suspense fallback={<p className="py-10 text-center text-slate-400">Loading console…</p>}>
      <AdminConsole />
    </Suspense>
  );
}

function TeacherDashboard() {
  const [section, setSection] = useState('overview');

  return (
    <DashboardShell role="teacher" section={section} onSection={setSection} rail={<TeacherRail />}>
      {section === 'overview' && (
        <>
          <TeacherClassroom />
          <TeacherCalendarCard />
        </>
      )}

      {section === 'classroom' && <TeacherClassroom />}

      {/* Exam updates are published to every signed-in role and were shown to
          families only — board dates and pattern changes matter at least as
          much to the teacher planning the syllabus. */}
      {section === 'schedule' && (
        <>
          <TeacherCalendarCard />
          <ExamUpdatesCard />
        </>
      )}

      {/* The company material a teacher is meant to teach from. Resolved for
          teachers by the same endpoint all along; simply never rendered. */}
      {section === 'materials' && <ClassMaterialsSection audience="teacher" />}

      {section === 'requests' && (
        <>
          <TeacherReschedulesCard />
          <TeacherProposalsCard />
        </>
      )}

      {section === 'profile' && (
        <>
          <TeacherProfileCard />
          {/* Full width: it is a four-step form with an availability grid in it,
              and squeezing it into a half column makes that grid scroll
              sideways on a laptop. */}
          <PhysicalProfileCard />
          <KycCard />
        </>
      )}

      {section === 'support' && <SupportCard />}
    </DashboardShell>
  );
}

function ParentDashboard() {
  const [section, setSection] = useState('overview');

  return (
    <DashboardShell role="parent" section={section} onSection={setSection} rail={<ParentRail />}>
      {section === 'overview' && (
        <>
          <GettingStartedCard onGoTo={setSection} />
          <MyCoursesCard />
          <UpcomingClassesCard />
          <ExamUpdatesCard />
        </>
      )}

      {section === 'classes' && (
        <>
          <EnrollmentsCard />
          <UpcomingClassesCard />
          <TuitionRequirementsCard />
        </>
      )}

      {/* Company-published decks and worksheets. The endpoint has always
          resolved these for a parent (via their children's enrolments), but
          only the student dashboard ever rendered them — so the parent paying
          for the course could not see the material it comes with. */}
      {section === 'materials' && (
        <>
          <MyCoursesCard />
          <ClassMaterialsSection audience="parent" />
        </>
      )}

      {/* PlansAndOffersCard removed: like Certificates it was a permanent
          "coming soon" card with no model or endpoint behind it. */}
      {section === 'bookings' && <RequestsCard />}

      {section === 'achievements' && (
        <>
          <StudentRecordCard />
          <AchievementsCard />
        </>
      )}

      {section === 'children' && <StudentsCard />}

      {/* The account settings and receipts that /account holds are reachable
          from the header link now; KYC stays here because it is specific to
          home tuition rather than to the login. */}
      {section === 'account' && (
        <>
          <AccountSettingsCard />
          <MyOrdersCard />
          <KycCard />
        </>
      )}

      {section === 'support' && <SupportCard />}
    </DashboardShell>
  );
}

/**
 * A student sees their own learning and nothing about running an account:
 * no "my students" (adding children is a guardian's job), no KYC (we verify
 * the adult), no demo-booking card (a demo is booked by whoever pays).
 *
 * Laid out to the reference the owner supplied (left nav, wide learning
 * column, stats rail) in IndiaTutors colours, and full width at every size.
 * The sections are switched in the sidebar rather than stacked into one long
 * scroll, which is what made the old page a column of mostly-empty cards.
 */
function StudentDashboard() {
  const { user } = useAuth();
  const profile = user.student_profile;
  const [section, setSection] = useState('overview');

  // An account nobody has linked to a student record has no classes, no
  // materials and no portfolio — and no amount of layout fixes that. Say so
  // once, plainly, instead of rendering six empty cards.
  if (!profile) {
    return (
      <DashboardShell role="student" section="overview" onSection={() => {}}>
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <h2 className="font-heading text-lg font-bold text-[#0B1220]">Your account isn't linked to a student yet</h2>
          <p className="mt-2 text-sm text-slate-600">
            Ask your parent or our team to link it — then your classes, materials and portfolio all appear here.
          </p>
        </section>
        <SupportCard />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="student" section={section} onSection={setSection}>
      {section === 'overview' && (
        <>
          <KeepLearning />
          <UpcomingClassesCard />
          <SuggestedCourses />
        </>
      )}

      {section === 'classes' && (
        <>
          <EnrollmentsCard />
          <UpcomingClassesCard />
          <ExamUpdatesCard />
        </>
      )}

      {section === 'materials' && <ClassMaterialsSection audience="student"><MyCoursesCard /></ClassMaterialsSection>}

      {section === 'achievements' && (
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <h2 className="font-heading mb-1 flex items-center gap-2 text-lg font-bold text-[#0B1220]">
            <Award className="h-5 w-5 text-brand-600" />My portfolio
          </h2>
          <p className="mb-3 flex flex-wrap items-center gap-x-1.5 text-xs text-slate-500">
            <span>Your achievements, certificates and milestones — added by you and your teachers.</span>
            <span className="rounded bg-brand-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-brand-700">{profile.code}</span>
          </p>
          {/* audience="student": the panel is shared with the teacher's
              classroom and the parent's child rows, and its default blurb
              describes building "the student's" portfolio "visible to the
              parent and the assigned teacher" — written for staff and shown,
              until now, to the child it is about. */}
          <PortfolioPanel studentId={profile.id} audience="student" />
        </section>
      )}

      {section === 'support' && <SupportCard />}
    </DashboardShell>
  );
}

/**
 * What a new parent should do next.
 *
 * Signing up gets you six cards that are all empty, in an order that reads
 * backwards: bookings and enrolments first, "add your child" fifth. But nothing
 * else works until a child exists, and the page never says so — it just shows
 * six variations of "nothing here yet".
 *
 * So: three steps, the first unfinished one called out, and the card removes
 * itself the moment they are done. Deliberately not a dismissible tour — it is
 * derived from real state, so it cannot claim a step is incomplete when it
 * isn't, and it cannot linger once the account is running.
 */
function GettingStartedCard({ onGoTo }) {
  const { data: students = [], isLoading: ls } = useQuery({ queryKey: ['students'], queryFn: fetchStudents });
  const { data: requests = [], isLoading: lr } = useQuery({ queryKey: ['my-demo-requests'], queryFn: fetchMyDemoRequests });
  const { data: enrolments = [], isLoading: le } = useQuery({ queryKey: ['my-enrollments'], queryFn: fetchMyEnrollments });

  // Say nothing until we know — a flash of "you have no children" while the
  // request is in flight is worse than a moment of blank space.
  if (ls || lr || le) return null;
  if (enrolments.length) return null;   // up and running; the cards speak for themselves

  const steps = [
    // section, not '#students'. This card renders in the OVERVIEW section and
    // StudentsCard (which carries id="students") only mounts under "My
    // children" — so the anchor pointed at a node that was not on the page and
    // the first button a new parent ever presses did nothing at all.
    { done: students.length > 0, title: 'Add your child',
      body: 'Their class, board and subjects — everything else is matched against this.',
      cta: 'Add a student', section: 'children' },
    { done: requests.length > 0, title: 'Book a free demo',
      body: 'Meet a teacher first. No card, no commitment.',
      cta: 'Book a free demo', href: '/book-demo' },
    { done: false, title: 'Start classes',
      body: 'After the demo we set up the schedule, and your classes, homework and progress appear here.',
      cta: null, href: null },
  ];
  const next = steps.findIndex(s => !s.done);

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
      <h2 className="flex items-center gap-2 text-lg font-bold"><Lightbulb className="h-5 w-5 text-brand-600" />Getting started</h2>
      <p className="mb-4 mt-0.5 text-xs text-slate-500">Three steps and you're set up.</p>

      <ol className="space-y-2">
        {steps.map((s, i) => {
          const isNext = i === next;
          return (
            <li key={s.title}
              className={`flex items-start gap-3 rounded-xl p-3 ring-1 ${
                isNext ? 'bg-brand-50/60 ring-brand-200' : 'ring-slate-100'}`}>
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                s.done ? 'bg-green-100 text-green-700' : isNext ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                {s.done ? '✓' : i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-bold ${s.done ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{s.title}</p>
                {!s.done && <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{s.body}</p>}
              </div>
              {isNext && s.cta && (
                s.section ? (
                  <button type="button" onClick={() => onGoTo?.(s.section)}
                    className="shrink-0 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-700">{s.cta}</button>
                ) : (
                  <Link to={s.href} className="shrink-0 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-700">{s.cta}</Link>
                )
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

// Purchased video courses, surfaced on the dashboard so a buyer lands on their
// library right after signing in. Hidden entirely when they own nothing — an
// empty "you have no courses" card on every parent's dashboard is just noise;
// /my-courses carries the empty state for people who go looking.
function MyCoursesCard() {
  const { data: courses = [], isLoading } = useQuery({ queryKey:['my-video-courses'], queryFn: fetchMyVideoCourses });
  if (isLoading || !courses.length) return null;

  return (
    <div className="rounded-xl bg-white ring-1 ring-slate-100 p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-bold text-slate-800"><BookOpen className="h-4 w-4 text-brand-600" /> My Courses</h2>
        <Link to="/my-courses" className="text-xs font-bold text-brand-600 hover:underline">View all</Link>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {courses.slice(0, 3).map(c => (
          // min-w-0: a grid item defaults to min-width:auto, so without it the flex
          // row refuses to shrink and the title's truncate never engages.
          <Link key={c.slug} to={`/video-courses/${c.slug}`}
            className="flex min-w-0 items-center gap-3 rounded-lg ring-1 ring-slate-100 p-2.5 hover:bg-slate-50">
            <div className="h-10 w-16 shrink-0 overflow-hidden rounded bg-slate-100">
              {c.thumbnail && <img src={c.thumbnail} alt="" className="h-full w-full object-cover" loading="lazy" />}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800">{c.title}</p>
              <p className="text-xs text-slate-500">{c.lesson_count} lessons</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function TeacherProfileCard() {
  const qc = useQueryClient();
  const { data: p, isLoading } = useQuery({ queryKey:['teacher-profile'], queryFn: fetchTeacherProfile });
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);
  const value = form ?? (p ? {
    headline:p.headline||'', qualification:p.qualification||'', subjects:p.subjects||'', languages:p.languages||'',
    experience_years:p.experience_years||'', fee_hourly:p.fee_hourly||'', city:p.city||'', teaching_mode:p.teaching_mode||'online',
    service_areas:p.service_areas||'', bio:p.bio||'', slots:p.availability?.slots||'', days:p.availability?.days||[],
  } : null);
  const set = k => e => { setSaved(false); setForm({ ...value, [k]: e.target.value }); };
  const toggleDay = d => { setSaved(false); const days = value.days.includes(d) ? value.days.filter(x=>x!==d) : [...value.days, d]; setForm({ ...value, days }); };
  const save = useMutation({
    mutationFn: () => updateTeacherProfile({ ...value, experience_years: value.experience_years?Number(value.experience_years):null, fee_hourly: value.fee_hourly?Number(value.fee_hourly):null, availability:{ days:value.days, slots:value.slots } }),
    onSuccess: () => { setSaved(true); qc.invalidateQueries({queryKey:['teacher-profile']}); },
  });
  const statusBadge = { pending:'bg-amber-50 text-amber-700', approved:'bg-green-50 text-green-700', rejected:'bg-red-50 text-red-700' };
  const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

  if (isLoading || !value) return <section className="rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm p-6 text-sm text-slate-400">Loading profile…</section>;

  return (
    <section className="rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-bold flex items-center gap-2"><Briefcase className="h-5 w-5 text-brand-600"/>Teacher profile</h2>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusBadge[p.status]||'bg-slate-100'}`}>{p.status}</span>
      </div>
      <p className="text-xs text-slate-500 mb-4">Complete your profile so our team can review and approve you.</p>
      <form onSubmit={e=>{e.preventDefault();save.mutate();}} className="space-y-3">
        <input value={value.headline} onChange={set('headline')} placeholder="Headline (e.g. Physics & Math mentor)" className={inp}/>
        <div className="grid grid-cols-2 gap-2">
          <input value={value.qualification} onChange={set('qualification')} placeholder="Qualification" className={inp}/>
          <input value={value.subjects} onChange={set('subjects')} placeholder="Subjects (comma-sep)" className={inp}/>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <input type="number" value={value.experience_years} onChange={set('experience_years')} placeholder="Years exp." className={inp}/>
          <input type="number" value={value.fee_hourly} onChange={set('fee_hourly')} placeholder="₹/hour" className={inp}/>
          <input value={value.languages} onChange={set('languages')} placeholder="Languages" className={inp}/>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <select value={value.teaching_mode} onChange={set('teaching_mode')} className={inp}>
            <option value="online">Online</option><option value="home">Home tuition</option><option value="both">Online & Home</option>
          </select>
          <input value={value.city} onChange={set('city')} placeholder="City" className={inp}/>
        </div>
        <input value={value.service_areas} onChange={set('service_areas')} placeholder="Service areas / pincodes (e.g. 700001, Salt Lake)" className={inp}/>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Availability</label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {DAYS.map(d => <button type="button" key={d} onClick={()=>toggleDay(d)} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${value.days.includes(d)?'bg-brand-600 text-white':'bg-slate-100 text-slate-600'}`}>{d}</button>)}
          </div>
          <input value={value.slots} onChange={set('slots')} placeholder="Time slots (e.g. 5-8pm weekdays)" className={inp}/>
        </div>
        <textarea rows={3} value={value.bio} onChange={set('bio')} placeholder="Short bio" className={inp}/>
        <div className="flex items-center gap-3">
          <button disabled={save.isPending} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 text-white px-4 py-2 text-sm font-bold hover:bg-brand-700 disabled:opacity-60">
            <Save className="h-4 w-4"/> {save.isPending?'Saving…':'Save profile'}
          </button>
          {saved && <span className="text-sm text-green-600 font-semibold">Saved ✓</span>}
        </div>
      </form>
    </section>
  );
}

function TeacherClassroom() {
  const { data: profile } = useQuery({ queryKey:['teacher-profile'], queryFn: fetchTeacherProfile });
  const approved = profile?.status === 'approved';
  const { data: roster = [], isLoading } = useQuery({ queryKey:['teacher-students'], queryFn: fetchTeacherStudents, enabled: approved });
  const { data: demos = [] } = useQuery({ queryKey:['teacher-demos'], queryFn: fetchTeacherDemos, enabled: approved });

  return (
    <section className="rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm p-6">
      <h2 className="text-lg font-bold flex items-center gap-2 mb-1"><Users className="h-5 w-5 text-brand-600"/>My classroom</h2>
      <p className="text-xs text-slate-500 mb-4">Students assigned to you, their upcoming demos, and the class progress you log.</p>

      {!approved ? (
        <div className="rounded-lg bg-amber-50 text-amber-800 text-sm p-4">
          Your classroom unlocks once our team approves your teacher profile. Complete your profile and KYC above to speed things up.
        </div>
      ) : (
        <>
          {demos.length > 0 && (
            <div className="mb-5">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Upcoming demos</h3>
              <ul className="divide-y divide-slate-100">
                {demos.map(d => (
                  <li key={d.id} className="flex items-center justify-between py-2.5">
                    <div>
                      <div className="font-semibold text-sm text-slate-800">{d.course?.name || d.subject || 'Demo class'}</div>
                      <div className="text-xs text-slate-500">{[d.student, d.grade, d.mode, d.city].filter(Boolean).join(' · ')}</div>
                    </div>
                    <span className="text-xs text-slate-500">{d.scheduled_at ? new Date(d.scheduled_at).toLocaleString() : 'To be scheduled'}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">My students</h3>
          {isLoading ? <p className="text-sm text-slate-400">Loading…</p> : roster.length ? (
            <ul className="space-y-2">
              {roster.map(e => <RosterRow key={e.id} e={e} />)}
            </ul>
          ) : <p className="text-sm text-slate-500">No students assigned yet. Once a demo is converted to an enrollment, your students appear here.</p>}
        </>
      )}
    </section>
  );
}

function RosterRow({ e }) {
  const [open, setOpen] = useState(false);
  const statusColor = { active:'bg-green-50 text-green-700', paused:'bg-amber-50 text-amber-700', completed:'bg-blue-50 text-blue-700', cancelled:'bg-slate-100 text-slate-600' };
  return (
    <li className="rounded-lg ring-1 ring-slate-100 overflow-hidden">
      <button onClick={()=>setOpen(o=>!o)} className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-slate-50">
        <div className="min-w-0">
          <div className="font-semibold text-sm text-slate-800">{e.student || 'Student'}</div>
          <div className="text-xs text-slate-500">{[e.course, e.plan, `${e.classes_count||0} class${e.classes_count===1?'':'es'} logged`, e.last_class_on && `last ${e.last_class_on}`].filter(Boolean).join(' · ')}</div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusColor[e.status]||'bg-slate-100 text-slate-600'}`}>{e.status}</span>
          {open ? <ChevronUp className="h-4 w-4 text-slate-400"/> : <ChevronDown className="h-4 w-4 text-slate-400"/>}
        </div>
      </button>
      {open && <ClassroomTabs enrollmentId={e.id} studentId={e.student_id} />}
    </li>
  );
}

function ClassroomTabs({ enrollmentId, studentId }) {
  const [tab, setTab] = useState('log');
  const tabs = [['log','Class log',BookOpen],['curriculum','Curriculum',ListChecks],['materials','Materials',FolderOpen],['portfolio','Portfolio',Award]];
  return (
    <div className="border-t border-slate-100 bg-slate-50">
      <div className="flex flex-wrap gap-1 px-3 pt-2">
        {tabs.map(([k,label,Icon]) => (
          <button key={k} onClick={()=>setTab(k)} className={`inline-flex items-center gap-1.5 rounded-t-lg px-3 py-1.5 text-xs font-bold ${tab===k?'bg-white text-brand-700 ring-1 ring-slate-100 ring-b-0':'text-slate-500 hover:text-slate-700'}`}>
            <Icon className="h-3.5 w-3.5"/>{label}
          </button>
        ))}
      </div>
      {tab==='log' && <ClassLogPanel enrollmentId={enrollmentId} />}
      {tab==='curriculum' && <CurriculumPanel enrollmentId={enrollmentId} />}
      {tab==='materials' && <MaterialsPanel enrollmentId={enrollmentId} />}
      {tab==='portfolio' && (studentId ? <PortfolioPanel studentId={studentId} /> : <p className="p-3 text-sm text-slate-400">No student linked.</p>)}
    </div>
  );
}

// Shared by the teacher's classroom tab, the parent's student rows AND the
// student's own Achievements section — so the blurb has to change voice. The
// staff wording ("the student's portfolio … visible to the parent and the
// assigned teacher") was being shown to the child it describes.
const PORTFOLIO_BLURB = {
  staff: "Build the student's portfolio — achievements, certificates, milestones and artwork. Visible to the parent and the assigned teacher.",
  student: 'Your achievements, certificates, milestones and artwork. Your parent and your teacher can see these too.',
};

function PortfolioPanel({ studentId, audience = 'staff' }) {
  const qc = useQueryClient();
  const fileRef = useRef();
  const { data: items = [], isLoading } = useQuery({ queryKey:['portfolio', studentId], queryFn:()=>fetchPortfolio(studentId) });
  const [form, setForm] = useState({ type:'achievement', title:'', description:'', awarded_on:'', link_url:'' });
  const [err, setErr] = useState('');
  const invalidate = () => qc.invalidateQueries({queryKey:['portfolio', studentId]});
  const add = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      Object.entries(form).forEach(([k,v]) => { if (v) fd.append(k, v); });
      if (fileRef.current?.files[0]) fd.append('file', fileRef.current.files[0]);
      return addPortfolioItem(studentId, fd);
    },
    onSuccess: () => { setForm({type:'achievement',title:'',description:'',awarded_on:'',link_url:''}); if(fileRef.current) fileRef.current.value=''; setErr(''); invalidate(); },
    onError: (e) => setErr(e?.response?.data?.message || Object.values(e?.response?.data?.errors||{})[0]?.[0] || 'Could not save.'),
  });
  const remove = useMutation({ mutationFn: deletePortfolioItem, onSuccess: invalidate });
  const TYPE_ICON = { achievement:'🏆', certificate:'📜', milestone:'🎯', artwork:'🎨', other:'⭐' };

  return (
    <div className="p-3 space-y-3">
      <p className="text-xs text-slate-500">{PORTFOLIO_BLURB[audience] ?? PORTFOLIO_BLURB.staff}</p>
      {isLoading ? <p className="text-sm text-slate-400">Loading…</p> : items.length ? (
        <ul className="space-y-1.5">
          {items.map(i => (
            <li key={i.id} className="flex items-center gap-2 rounded-md bg-white ring-1 ring-slate-100 px-3 py-2">
              <span className="shrink-0">{TYPE_ICON[i.type] || '⭐'}</span>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-sm text-slate-800">{i.title}</div>
                <div className="text-xs text-slate-500">{[i.type, i.awarded_on, i.added_by && `by ${i.added_by.name}`].filter(Boolean).join(' · ')}</div>
                {i.description && <div className="text-xs text-slate-500 mt-0.5">{i.description}</div>}
              </div>
              {i.has_file && <button onClick={()=>downloadPortfolioItem(i.id)} className="p-1.5 text-slate-400 hover:text-brand-600" title="Download"><Download className="h-4 w-4"/></button>}
              {i.link_url && <a href={i.link_url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-slate-400 hover:text-brand-600" title="Open link"><Link2 className="h-4 w-4"/></a>}
              <button onClick={()=>remove.mutate(i.id)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 className="h-3.5 w-3.5"/></button>
            </li>
          ))}
        </ul>
      ) : <p className="text-sm text-slate-500">Nothing in the portfolio yet — add the first entry below.</p>}
      {err && <div className="rounded-md bg-red-50 text-red-700 text-xs p-2">{err}</div>}
      <form onSubmit={e=>{e.preventDefault();add.mutate();}} className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} className={inp}>
            {['achievement','certificate','milestone','artwork','other'].map(t=><option key={t} value={t} className="capitalize">{t}</option>)}
          </select>
          <input required value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Title (e.g. Piano Grade 1)" className={inp}/>
        </div>
        <input value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Description (optional)" className={inp}/>
        <div className="grid grid-cols-2 gap-2 items-center">
          <input type="date" value={form.awarded_on} onChange={e=>setForm({...form,awarded_on:e.target.value})} className={inp}/>
          <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.pdf" className="text-sm text-slate-600 file:mr-2 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-semibold"/>
        </div>
        <input value={form.link_url} onChange={e=>setForm({...form,link_url:e.target.value})} placeholder="…or paste a link (optional)" className={inp}/>
        <button disabled={add.isPending} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 text-white px-4 py-2 text-sm font-bold hover:bg-brand-700 disabled:opacity-60">
          <Plus className="h-4 w-4"/>{add.isPending?'Adding…':'Add to portfolio'}
        </button>
      </form>
    </div>
  );
}

function TeacherCalendarCard() {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0,7)); // YYYY-MM
  const { data: d, isLoading } = useQuery({ queryKey:['teacher-calendar', month], queryFn:()=>fetchTeacherCalendar(month) });
  const shift = (delta) => {
    const [y,m] = month.split('-').map(Number);
    const next = new Date(y, m - 1 + delta, 1);
    setMonth(`${next.getFullYear()}-${String(next.getMonth()+1).padStart(2,'0')}`);
  };
  const [y,m] = month.split('-').map(Number);
  const first = new Date(y, m-1, 1);
  const daysInMonth = new Date(y, m, 0).getDate();
  const leading = (first.getDay() + 6) % 7; // Monday-first grid
  const byDate = {};
  (d?.classes||[]).forEach(c => { (byDate[c.date] = byDate[c.date] || []).push({ ...c, kind:'class' }); });
  (d?.demos||[]).forEach(x => { (byDate[x.date] = byDate[x.date] || []).push({ ...x, kind:'demo' }); });
  const dot = { completed:'bg-green-500', scheduled:'bg-blue-500', missed:'bg-red-500', demo:'bg-amber-500' };
  const monthLabel = first.toLocaleDateString('en-IN', { month:'long', year:'numeric' });
  const today = new Date().toISOString().slice(0,10);
  const upcoming = Object.entries(byDate).flatMap(([date, evs]) => evs.map(e => ({...e, date})))
    .filter(e => e.date >= today && (e.kind==='demo' || e.status==='scheduled'))
    .sort((a,b) => a.date.localeCompare(b.date)).slice(0,6);

  return (
    <section className="rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm p-6">
      {/* flex-wrap + a narrower month label: at 360px the fixed 9rem label and
          the two arrows pushed the card 8px past the viewport. */}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 mb-1">
        <h2 className="text-lg font-bold flex items-center gap-2"><Calendar className="h-5 w-5 text-brand-600"/>Class calendar</h2>
        <div className="flex items-center gap-1">
          <button onClick={()=>shift(-1)} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500" aria-label="Previous month"><ChevronLeft className="h-4 w-4"/></button>
          <span className="text-sm font-bold text-slate-700 min-w-[7.5rem] sm:min-w-[9rem] text-center">{monthLabel}</span>
          <button onClick={()=>shift(1)} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500" aria-label="Next month"><ChevronRight className="h-4 w-4"/></button>
        </div>
      </div>
      <p className="text-xs text-slate-500 mb-4">Your logged and scheduled classes plus assigned demos.
        <span className="ml-2 inline-flex items-center gap-2 text-[11px]">
          <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"/>done</span>
          <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"/>scheduled</span>
          <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"/>missed</span>
          <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"/>demo</span>
        </span>
      </p>
      {isLoading ? <p className="text-sm text-slate-400">Loading…</p> : (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_16rem] gap-5">
          <div>
            <div className="grid grid-cols-7 text-center text-[11px] font-bold text-slate-400 mb-1">
              {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(w=><div key={w}>{w}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({length: leading}).map((_,i)=><div key={'x'+i}/>)}
              {Array.from({length: daysInMonth},(_,i)=>{
                const date = `${month}-${String(i+1).padStart(2,'0')}`;
                const evs = byDate[date] || [];
                return (
                  <div key={date} title={evs.map(e=>e.kind==='demo'?`Demo: ${e.subject||''} ${e.time||''}`:`${e.topic} (${e.status})`).join('\n')}
                    className={`min-h-[3rem] rounded-lg p-1 text-xs ring-1 ${date===today?'ring-brand-400 bg-brand-50':'ring-slate-100'} ${evs.length?'bg-white':'bg-slate-50/50'}`}>
                    <div className="text-[11px] font-semibold text-slate-500">{i+1}</div>
                    <div className="flex flex-wrap gap-0.5 mt-0.5">
                      {evs.slice(0,4).map((e,j)=><span key={j} className={`w-2 h-2 rounded-full ${dot[e.kind==='demo'?'demo':e.status]||'bg-slate-300'}`}/>)}
                      {evs.length>4 && <span className="text-[9px] text-slate-400">+{evs.length-4}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Upcoming</h3>
            {upcoming.length ? (
              <ul className="space-y-1.5">
                {upcoming.map((e,i)=>(
                  <li key={i} className="rounded-lg ring-1 ring-slate-100 px-2.5 py-1.5">
                    <div className="text-xs font-semibold text-slate-800 truncate">{e.kind==='demo' ? `Demo · ${e.subject||'class'}` : e.topic}</div>
                    <div className="text-[11px] text-slate-500">{e.date}{e.time?` · ${e.time}`:''}{e.student?` · ${e.student}`:''}</div>
                  </li>
                ))}
              </ul>
            ) : <p className="text-xs text-slate-400">Nothing scheduled this month.</p>}
          </div>
        </div>
      )}
    </section>
  );
}

function CurriculumPanel({ enrollmentId }) {
  const qc = useQueryClient();
  const { data: items = [], isLoading } = useQuery({ queryKey:['curriculum', enrollmentId], queryFn:()=>fetchCurriculum(enrollmentId) });
  const [form, setForm] = useState({ topic:'', details:'' });
  const invalidate = () => qc.invalidateQueries({queryKey:['curriculum', enrollmentId]});
  const add = useMutation({ mutationFn:()=>addCurriculumItem(enrollmentId, form), onSuccess:()=>{ setForm({topic:'',details:''}); invalidate(); } });
  const setStatus = useMutation({ mutationFn:({id,status})=>updateCurriculumItem(enrollmentId, id, {status}), onSuccess:invalidate });
  const remove = useMutation({ mutationFn:(id)=>deleteCurriculumItem(enrollmentId, id), onSuccess:invalidate });
  const statusColor = { pending:'bg-slate-100 text-slate-600', in_progress:'bg-blue-50 text-blue-700', done:'bg-green-50 text-green-700' };
  const NEXT = { pending:'in_progress', in_progress:'done', done:'pending' };

  return (
    <div className="p-3 space-y-3">
      <p className="text-xs text-slate-500">Define the curriculum classwise — tap a status chip to advance it (pending → in progress → done). Parents see this as the progress tracker.</p>
      {isLoading ? <p className="text-sm text-slate-400">Loading…</p> : items.length ? (
        <ol className="space-y-1.5">
          {items.map((it, i) => (
            <li key={it.id} className="flex items-center gap-2 rounded-md bg-white ring-1 ring-slate-100 px-3 py-2">
              <span className="text-xs font-bold text-slate-400 w-5">{i+1}.</span>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-sm text-slate-800">{it.topic}</div>
                {it.details && <div className="text-xs text-slate-500">{it.details}</div>}
              </div>
              <button onClick={()=>setStatus.mutate({id:it.id, status:NEXT[it.status]})} className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${statusColor[it.status]}`} title="Click to advance">
                {it.status.replace('_',' ')}
              </button>
              <button onClick={()=>remove.mutate(it.id)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 className="h-3.5 w-3.5"/></button>
            </li>
          ))}
        </ol>
      ) : <p className="text-sm text-slate-500">No curriculum yet — add the first topic below.</p>}
      <form onSubmit={e=>{e.preventDefault();add.mutate();}} className="space-y-2">
        <input required value={form.topic} onChange={e=>setForm({...form,topic:e.target.value})} placeholder="Topic (e.g. Quadratic equations)" className={inp}/>
        <input value={form.details} onChange={e=>setForm({...form,details:e.target.value})} placeholder="Details (optional)" className={inp}/>
        <button disabled={add.isPending} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 text-white px-4 py-2 text-sm font-bold hover:bg-brand-700 disabled:opacity-60">
          <Plus className="h-4 w-4"/>{add.isPending?'Adding…':'Add topic'}
        </button>
      </form>
    </div>
  );
}

function MaterialsPanel({ enrollmentId }) {
  const qc = useQueryClient();
  const fileRef = useRef();
  const { data: items = [], isLoading } = useQuery({ queryKey:['materials', enrollmentId], queryFn:()=>fetchMaterials(enrollmentId) });
  const [form, setForm] = useState({ type:'note', title:'', link_url:'' });
  const [err, setErr] = useState('');
  const invalidate = () => qc.invalidateQueries({queryKey:['materials', enrollmentId]});
  const add = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append('type', form.type); fd.append('title', form.title);
      if (form.link_url) fd.append('link_url', form.link_url);
      if (fileRef.current?.files[0]) fd.append('file', fileRef.current.files[0]);
      return uploadMaterial(enrollmentId, fd);
    },
    onSuccess: () => { setForm({type:'note',title:'',link_url:''}); if(fileRef.current) fileRef.current.value=''; setErr(''); invalidate(); },
    onError: (e) => setErr(e?.response?.data?.message || Object.values(e?.response?.data?.errors||{})[0]?.[0] || 'Upload failed.'),
  });
  const remove = useMutation({ mutationFn:(id)=>deleteMaterial(enrollmentId, id), onSuccess:invalidate });
  const TYPES = [['note','Note'],['ppt','PPT'],['lesson_plan','Lesson plan'],['question_bank','Question bank'],['homework','Homework'],['other','Other']];

  return (
    <div className="p-3 space-y-3">
      <p className="text-xs text-slate-500">Share notes, PPTs, lesson plans, question banks or homework — parents can download them from their dashboard.</p>
      {isLoading ? <p className="text-sm text-slate-400">Loading…</p> : items.length ? (
        <ul className="space-y-1.5">
          {items.map(m => (
            <li key={m.id} className="flex items-center gap-2 rounded-md bg-white ring-1 ring-slate-100 px-3 py-2">
              <FileText className="h-4 w-4 text-slate-400 shrink-0"/>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-sm text-slate-800">{m.title}</div>
                <div className="text-xs text-slate-500 capitalize">{m.type.replace('_',' ')}{m.original_name && ` · ${m.original_name}`}</div>
              </div>
              {m.has_file && <button onClick={()=>downloadMaterial(m.id, m.original_name)} className="p-1.5 text-slate-400 hover:text-brand-600" title="Download"><Download className="h-4 w-4"/></button>}
              {m.link_url && <a href={m.link_url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-slate-400 hover:text-brand-600" title="Open link"><Link2 className="h-4 w-4"/></a>}
              <button onClick={()=>remove.mutate(m.id)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 className="h-3.5 w-3.5"/></button>
            </li>
          ))}
        </ul>
      ) : <p className="text-sm text-slate-500">Nothing shared yet.</p>}
      {err && <div className="rounded-md bg-red-50 text-red-700 text-xs p-2">{err}</div>}
      <form onSubmit={e=>{e.preventDefault();add.mutate();}} className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} className={inp}>
            {TYPES.map(([v,l])=><option key={v} value={v}>{l}</option>)}
          </select>
          <input required value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Title" className={inp}/>
        </div>
        <div className="grid grid-cols-2 gap-2 items-center">
          <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.txt" className="text-sm text-slate-600 file:mr-2 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-semibold"/>
          <input value={form.link_url} onChange={e=>setForm({...form,link_url:e.target.value})} placeholder="…or paste a link (video, Drive)" className={inp}/>
        </div>
        <button disabled={add.isPending} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 text-white px-4 py-2 text-sm font-bold hover:bg-brand-700 disabled:opacity-60">
          <Upload className="h-4 w-4"/>{add.isPending?'Sharing…':'Share material'}
        </button>
      </form>
    </div>
  );
}

function TeacherProposalsCard() {
  const qc = useQueryClient();
  const { data: items = [], isLoading } = useQuery({ queryKey:['my-proposals'], queryFn: fetchMyProposals });
  const [form, setForm] = useState({ title:'', description:'' });
  const add = useMutation({
    mutationFn: () => submitProposal(form),
    onSuccess: () => { setForm({title:'',description:''}); qc.invalidateQueries({queryKey:['my-proposals']}); },
  });
  const badge = { pending:'bg-amber-50 text-amber-700', approved:'bg-green-50 text-green-700', rejected:'bg-red-50 text-red-700' };

  return (
    <section className="rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm p-6">
      <h2 className="text-lg font-bold flex items-center gap-2 mb-1"><Lightbulb className="h-5 w-5 text-brand-600"/>Propose a course</h2>
      <p className="text-xs text-slate-500 mb-4">Want to teach a new subject? Propose it — once our team approves, it's added to your profile.</p>
      {isLoading ? <p className="text-sm text-slate-400">Loading…</p> : items.length > 0 && (
        <ul className="space-y-1.5 mb-4">
          {items.map(p => (
            <li key={p.id} className="flex items-center justify-between rounded-md ring-1 ring-slate-100 px-3 py-2">
              <span className="font-semibold text-sm text-slate-800">{p.title}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${badge[p.status]||'bg-slate-100'}`}>{p.status}</span>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={e=>{e.preventDefault();add.mutate();}} className="space-y-2">
        <input required value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Subject / course title (e.g. Astronomy)" className={inp}/>
        <textarea rows={2} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Short description (optional)" className={inp}/>
        <button disabled={add.isPending} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 text-white px-4 py-2 text-sm font-bold hover:bg-brand-700 disabled:opacity-60">
          <Plus className="h-4 w-4"/>{add.isPending?'Submitting…':'Submit proposal'}
        </button>
      </form>
    </section>
  );
}

function ClassLogPanel({ enrollmentId }) {
  const qc = useQueryClient();
  const { data: logs = [], isLoading } = useQuery({ queryKey:['class-logs', enrollmentId], queryFn:()=>fetchClassLogs(enrollmentId) });
  const today = new Date().toISOString().slice(0,10);
  const empty = { topic:'', held_on:today, duration_min:'', homework:'', notes:'', status:'completed' };
  const [form, setForm] = useState(empty);
  const [err, setErr] = useState('');
  const set = k => e => setForm({ ...form, [k]: e.target.value });
  const add = useMutation({
    mutationFn: () => addClassLog(enrollmentId, { ...form, duration_min: form.duration_min?Number(form.duration_min):null }),
    onSuccess: () => { setForm(empty); setErr(''); qc.invalidateQueries({queryKey:['class-logs', enrollmentId]}); qc.invalidateQueries({queryKey:['teacher-students']}); qc.invalidateQueries({queryKey:['teacher-calendar']}); },
    onError: (e) => setErr(Object.values(e?.response?.data?.errors||{})[0]?.[0] || 'Could not save the class.'),
  });
  const statusColor = { completed:'bg-green-50 text-green-700', scheduled:'bg-blue-50 text-blue-700', missed:'bg-red-50 text-red-700' };

  return (
    <div className="p-3 space-y-3">
      {isLoading ? <p className="text-sm text-slate-400">Loading…</p> : logs.length ? (
        <ul className="space-y-1.5">
          {logs.map(l => (
            <li key={l.id} className="rounded-md bg-white ring-1 ring-slate-100 px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-sm text-slate-800">{l.topic}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-slate-500">{l.held_on}{l.duration_min?` · ${l.duration_min}m`:''}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusColor[l.status]||'bg-slate-100 text-slate-600'}`}>{l.status}</span>
                </div>
              </div>
              {(l.homework || l.notes) && <div className="text-xs text-slate-500 mt-1">{[l.homework && `HW: ${l.homework}`, l.notes].filter(Boolean).join(' · ')}</div>}
            </li>
          ))}
        </ul>
      ) : <p className="text-sm text-slate-500">No classes logged yet.</p>}

      {err && <div className="rounded-md bg-red-50 text-red-700 text-xs p-2">{err}</div>}
      <form onSubmit={ev=>{ev.preventDefault();add.mutate();}} className="space-y-2">
        <input required value={form.topic} onChange={set('topic')} placeholder="Topic covered (e.g. Quadratic equations)" className={inp}/>
        <div className="grid grid-cols-3 gap-2">
          <input type="date" required value={form.held_on} onChange={set('held_on')} className={inp}/>
          <input type="number" value={form.duration_min} onChange={set('duration_min')} placeholder="Mins" className={inp}/>
          <select value={form.status} onChange={set('status')} className={inp}>
            <option value="completed">Completed</option><option value="scheduled">Scheduled</option><option value="missed">Missed</option>
          </select>
        </div>
        <input value={form.homework} onChange={set('homework')} placeholder="Homework assigned (optional)" className={inp}/>
        <textarea rows={2} value={form.notes} onChange={set('notes')} placeholder="Notes / progress (optional)" className={inp}/>
        <button disabled={add.isPending} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 text-white px-4 py-2 text-sm font-bold hover:bg-brand-700 disabled:opacity-60">
          <NotebookPen className="h-4 w-4"/> {add.isPending?'Saving…':'Log this class'}
        </button>
      </form>
    </div>
  );
}

function EnrollmentsCard() {
  const { data: items = [], isLoading } = useQuery({ queryKey:['my-enrollments'], queryFn: fetchMyEnrollments });
  return (
    <section className="rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm p-6">
      <h2 className="text-lg font-bold flex items-center gap-2 mb-1"><GraduationCap className="h-5 w-5 text-brand-600"/>My enrollments</h2>
      <p className="text-xs text-slate-500 mb-4">Open a class to see the teacher, curriculum progress, class history and shared materials.</p>
      {isLoading ? <p className="text-sm text-slate-400">Loading…</p> : items.length ? (
        <ul className="space-y-2">
          {items.map(e => <ParentEnrollmentRow key={e.id} e={e} />)}
        </ul>
      ) : <p className="text-sm text-slate-500">No active enrollments yet. Once you complete a demo, your enrolled classes appear here.</p>}
    </section>
  );
}

function ParentEnrollmentRow({ e }) {
  const [open, setOpen] = useState(false);
  const statusColor = { active:'bg-green-50 text-green-700', paused:'bg-amber-50 text-amber-700', completed:'bg-blue-50 text-blue-700', cancelled:'bg-slate-100 text-slate-600' };
  return (
    <li className="rounded-lg ring-1 ring-slate-100 overflow-hidden">
      <button onClick={()=>setOpen(o=>!o)} className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-slate-50">
        <div className="min-w-0">
          <div className="font-semibold text-sm text-slate-800">{e.course?.name || e.plan || 'Enrollment'}</div>
          <div className="text-xs text-slate-500">{[e.student, e.tutor?.name && `with ${e.tutor.name}`, e.plan].filter(Boolean).join(' · ')}</div>
          {/* The weekly timetable, on the row itself rather than behind the
              expander: "when is my child's class" is the question this card is
              opened to answer, and it used to require a phone call. */}
          {e.schedule?.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {e.schedule.map(s => (
                <span key={s.id} className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">{s.label}</span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusColor[e.status]||'bg-slate-100 text-slate-600'}`}>{e.status}</span>
          {open ? <ChevronUp className="h-4 w-4 text-slate-400"/> : <ChevronDown className="h-4 w-4 text-slate-400"/>}
        </div>
      </button>
      {open && <ParentEnrollmentDetail id={e.id} />}
    </li>
  );
}

function ParentEnrollmentDetail({ id }) {
  const { data: d, isLoading } = useQuery({ queryKey:['my-enrollment', id], queryFn:()=>fetchMyEnrollmentDetail(id) });
  const curStatus = { pending:'bg-slate-100 text-slate-500', in_progress:'bg-blue-50 text-blue-700', done:'bg-green-50 text-green-700' };
  const logStatus = { completed:'bg-green-50 text-green-700', scheduled:'bg-blue-50 text-blue-700', missed:'bg-red-50 text-red-700' };
  if (isLoading) return <div className="border-t border-slate-100 bg-slate-50 p-4 text-sm text-slate-400">Loading…</div>;
  if (!d) return null;
  const done = (d.curriculum||[]).filter(c=>c.status==='done').length;

  return (
    <div className="border-t border-slate-100 bg-slate-50 p-4 space-y-4">
      {d.teacher && (
        <div className="flex items-center gap-3 rounded-lg bg-white ring-1 ring-slate-100 p-3">
          <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold overflow-hidden shrink-0">
            {d.teacher.image_url ? <img src={d.teacher.image_url} alt="" className="w-full h-full object-cover"/> : (d.teacher.name||'?')[0]}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-sm text-slate-900">{d.teacher.name}</div>
            <div className="text-xs text-slate-500">{[d.teacher.qualification, d.teacher.experience_years && `${d.teacher.experience_years}y exp`, (d.teacher.subjects||[]).slice(0,3).join(', '), d.teacher.city].filter(Boolean).join(' · ')}</div>
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Curriculum progress</h4>
          {d.curriculum?.length > 0 && <span className="text-xs font-semibold text-slate-500">{done}/{d.curriculum.length} done</span>}
        </div>
        {d.curriculum?.length ? (
          <ol className="space-y-1">
            {d.curriculum.map((c,i) => (
              <li key={c.id} className="flex items-center gap-2 text-sm">
                <span className="text-xs font-bold text-slate-400 w-4">{i+1}.</span>
                <span className="flex-1 text-slate-700">{c.topic}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${curStatus[c.status]}`}>{c.status.replace('_',' ')}</span>
              </li>
            ))}
          </ol>
        ) : <p className="text-xs text-slate-400">The teacher hasn't published a curriculum yet.</p>}
      </div>

      <div>
        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">Class history</h4>
        {d.classes?.length ? (
          <ul className="space-y-1.5">
            {d.classes.map(l => (
              /* Homework and the teacher's notes were being fetched and thrown
                 away — the API has always returned them, but only the topic,
                 date and status were rendered. Teachers write "Exercise 4.2,
                 due next class" into the class log and neither the parent nor
                 the student could read it. */
              <li key={l.id} className="text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="min-w-0 flex-1 truncate text-slate-700">{l.topic}</span>
                  <span className="flex shrink-0 items-center gap-2 text-xs text-slate-500">
                    {l.held_on}
                    <span className={`rounded-full px-2 py-0.5 font-semibold ${logStatus[l.status]||'bg-slate-100'}`}>{l.status}</span>
                  </span>
                </div>
                {l.homework && (
                  <p className="mt-1 flex items-start gap-1.5 rounded-md bg-amber-50 px-2.5 py-1.5 text-xs text-amber-900 ring-1 ring-amber-100">
                    <NotebookPen className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span><span className="font-bold">Homework:</span> {l.homework}</span>
                  </p>
                )}
                {l.notes && (
                  <p className="mt-1 flex items-start gap-1.5 px-2.5 text-xs leading-relaxed text-slate-500">
                    <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span><span className="font-semibold text-slate-600">Teacher's note:</span> {l.notes}</span>
                  </p>
                )}
              </li>
            ))}
          </ul>
        ) : <p className="text-xs text-slate-400">No classes logged yet.</p>}
      </div>

      <RescheduleBlock id={id} reschedules={d.reschedules || []} />

      <div>
        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">Materials from the teacher</h4>
        {d.materials?.length ? (
          <ul className="space-y-1">
            {d.materials.map(m => (
              <li key={m.id} className="flex items-center gap-2 text-sm">
                <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0"/>
                <span className="flex-1 text-slate-700 truncate">{m.title} <span className="text-xs text-slate-400 capitalize">({m.type.replace('_',' ')})</span></span>
                {m.has_file && <button onClick={()=>downloadMaterial(m.id, m.original_name)} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"><Download className="h-3.5 w-3.5"/>Download</button>}
                {m.link_url && <a href={m.link_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"><Link2 className="h-3.5 w-3.5"/>Open</a>}
              </li>
            ))}
          </ul>
        ) : <p className="text-xs text-slate-400">Nothing shared yet.</p>}
      </div>
    </div>
  );
}

/**
 * E1 and E8 — the places these will live, holding nothing yet.
 *
 * Owner, 2026-08-10: keep the buttons and options, but show nothing for free
 * plans (E1, "decided later") and certification (E8, "we haven't decided").
 *
 * So these are scaffolding, and the copy says so plainly. The alternative —
 * inventing a plan tier or a certificate to fill the space — is exactly the
 * kind of placeholder that was cleaned out of this site in August, when
 * fabricated ratings and testimonials had to be deleted. An empty section that
 * admits it is empty can sit here safely until there is something real; a
 * fake one cannot.
 */
function ComingSoonCard({ icon: Icon, title, blurb }) {
  return (
    <section className="rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm p-6">
      <h2 className="text-lg font-bold flex items-center gap-2 mb-1">
        <Icon className="h-5 w-5 text-brand-600" />{title}
      </h2>
      <p className="text-sm text-slate-500">{blurb}</p>
      <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500 ring-1 ring-slate-100">
        Nothing here yet — we'll let you know as soon as this is available.
      </p>
    </section>
  );
}

/**
 * E6 — the student's own record.
 *
 * Every figure is counted from a real row. This is precisely the surface where
 * an invented number would never be challenged, and this project has already
 * had to delete two sets of those. So a stat with nothing behind it is omitted
 * rather than shown as a confident zero — except attendance, where zero is a
 * true and useful answer.
 */
function StudentRecordCard() {
  const { data: records = [], isLoading } = useQuery({ queryKey: ['my-record'], queryFn: fetchMyRecord });

  if (isLoading) return null;
  if (!records.length) return null;

  const Stat = ({ value, label, tone = 'text-brand-600' }) => (
    <div className="rounded-xl bg-slate-50 px-3 py-2.5 text-center ring-1 ring-slate-100">
      <div className={`font-heading text-xl font-extrabold ${tone}`}>{value}</div>
      <div className="text-[11px] uppercase tracking-wide text-slate-500 mt-0.5">{label}</div>
    </div>
  );

  return (
    <section className="rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm p-6">
      <h2 className="text-lg font-bold flex items-center gap-2 mb-1"><BarChart3 className="h-5 w-5 text-brand-600" />Learning so far</h2>
      <p className="text-xs text-slate-500 mb-4">Counted from your actual classes and materials — nothing estimated.</p>

      <div className="space-y-5">
        {records.map(r => (
          <div key={r.student.id}>
            {records.length > 1 && (
              <p className="mb-2 text-sm font-bold text-slate-800">{r.student.name}</p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Stat value={r.classes.attended} label="Classes attended" />
              <Stat value={r.classes.hours} label="Hours taught" />
              <Stat value={r.materials.total} label="Materials" />
              <Stat value={r.achievements.total} label="Achievements" />
            </div>
            {(r.classes.missed > 0 || r.substitutions > 0) && (
              <p className="mt-2 text-xs text-slate-500">
                {r.classes.missed > 0 && <>{r.classes.missed} missed{r.substitutions > 0 && ' · '}</>}
                {r.substitutions > 0 && <>{r.substitutions} covered by a substitute teacher</>}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

const CONSENT_TONE = {
  approved: 'bg-green-50 text-green-700', pending: 'bg-amber-50 text-amber-700', rejected: 'bg-slate-100 text-slate-500',
};

/**
 * E7 — achievements a family records and credits.
 *
 * Owner, 2026-08-10: this is where real testimonials come from, and it goes in
 * the student profile first (the teacher profile connects later).
 *
 * The consent checkbox is unticked by default and the copy says exactly what
 * ticking it means. The August audit found achievement photos of identifiable
 * minors reused from a sister brand — most subjects here are children, so
 * "shared publicly" has to be a deliberate act, reversible at any time.
 */
function AchievementsCard() {
  const qc = useQueryClient();
  const { data: items = [], isLoading } = useQuery({ queryKey: ['my-achievements'], queryFn: fetchMyAchievements });
  const { data: students = [] } = useQuery({ queryKey: ['students'], queryFn: fetchStudents });
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ student_id: '', title: '', body: '', achieved_on: '', consent_public: false, consent_name: false });

  const create = useMutation({
    mutationFn: () => createMyAchievement({ ...f, student_id: Number(f.student_id) || (students[0]?.id ?? null) }),
    onSuccess: () => {
      setF({ student_id: '', title: '', body: '', achieved_on: '', consent_public: false, consent_name: false });
      setOpen(false);
      qc.invalidateQueries({ queryKey: ['my-achievements'] });
    },
  });
  const setConsent = useMutation({
    mutationFn: ({ id, consent_public }) => updateMyAchievement({ id, consent_public }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-achievements'] }),
  });

  return (
    <section className="rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-bold flex items-center gap-2"><Award className="h-5 w-5 text-brand-600" />Achievements</h2>
        <button onClick={() => setOpen(o => !o)} className="text-sm font-semibold text-brand-600 hover:text-brand-700">
          {open ? 'Cancel' : '+ Add achievement'}
        </button>
      </div>
      <p className="text-xs text-slate-500 mb-4">
        Something your child achieved with us — an exam result, a grade, a competition. Yours to keep private, or to share.
      </p>

      {open && (
        <form className="mb-4 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100 space-y-3"
          onSubmit={e => { e.preventDefault(); create.mutate(); }}>
          {students.length > 1 && (
            <select value={f.student_id} onChange={e => setF({ ...f, student_id: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <option value="">Which student?</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
          <input required value={f.title} onChange={e => setF({ ...f, title: e.target.value })}
            placeholder="What did they achieve?" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          <textarea rows={2} value={f.body} onChange={e => setF({ ...f, body: e.target.value })}
            placeholder="Tell us a little more (optional)" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          <input type="date" value={f.achieved_on} onChange={e => setF({ ...f, achieved_on: e.target.value })}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />

          <label className="flex gap-2 items-start text-xs text-slate-600">
            <input type="checkbox" checked={f.consent_public} className="mt-0.5"
              onChange={e => setF({ ...f, consent_public: e.target.checked, consent_name: e.target.checked && f.consent_name })} />
            <span>You may share this on the Indiatutors website as a testimonial. Leave unticked to keep it private to my account.</span>
          </label>
          {f.consent_public && (
            <label className="flex gap-2 items-start text-xs text-slate-600 pl-6">
              <input type="checkbox" checked={f.consent_name} className="mt-0.5"
                onChange={e => setF({ ...f, consent_name: e.target.checked })} />
              <span>You may use my child's name. Otherwise it will read "a Class 8 student".</span>
            </label>
          )}

          <button disabled={!f.title || create.isPending}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60">
            {create.isPending ? 'Saving…' : 'Save achievement'}
          </button>
          {create.isError && (
            <p className="text-xs text-red-600">{create.error?.response?.data?.message || 'Could not save — please try again.'}</p>
          )}
        </form>
      )}

      {isLoading ? <p className="text-sm text-slate-400">Loading…</p> : items.length ? (
        <ul className="divide-y divide-slate-100">
          {items.map(a => (
            <li key={a.id} className="py-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-sm text-slate-800">{a.title}</span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${CONSENT_TONE[a.status] || ''}`}>{a.status}</span>
                {a.shown_publicly && <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">Shared publicly</span>}
              </div>
              <div className="text-xs text-slate-500">
                {[a.student, a.tutor?.name && `with ${a.tutor.name}`, a.achieved_on].filter(Boolean).join(' · ')}
              </div>
              {a.body && <p className="mt-1 text-sm text-slate-600">{a.body}</p>}
              <button onClick={() => setConsent.mutate({ id: a.id, consent_public: !a.consent_public })}
                disabled={setConsent.isPending}
                className="mt-1 text-xs font-semibold text-brand-600 hover:text-brand-700 disabled:opacity-60">
                {a.consent_public ? 'Stop sharing this publicly' : 'Allow this to be shared'}
              </button>
            </li>
          ))}
        </ul>
      ) : <p className="text-sm text-slate-500">Nothing added yet.</p>}
    </section>
  );
}

/*
 * PlansAndOffersCard and CertificatesCard are gone (2026-08-17).
 *
 * Both were ComingSoonCard instances, and neither could ever stop being one:
 * there is no Certificate model and no plans/offers model, so no endpoint
 * could fill either. "Certificates" was worse than a card — it was a top-level
 * item in the student's sidebar, so a child clicked a promised section and got
 * "Nothing here yet" every time, permanently.
 *
 * A certificate already has a truthful home: PortfolioItem supports
 * type: 'certificate' and the portfolio panel renders it. If the owner ever
 * wants issued certificates, that is a scoped feature with a model and an
 * admin issuance flow behind it — not a nav slot to be filled.
 *
 * ComingSoonCard itself stays: it is the honest way to hold a section that is
 * genuinely arriving, and is still the right tool the next time one is.
 */

function RequestsCard() {
  const { data: reqs = [], isLoading } = useQuery({ queryKey:['my-demo-requests'], queryFn: fetchMyDemoRequests });
  const statusColor = { new:'bg-amber-50 text-amber-700', contacted:'bg-indigo-50 text-indigo-700', scheduled:'bg-blue-50 text-blue-700', completed:'bg-teal-50 text-teal-700', converted:'bg-green-50 text-green-700', enrolled:'bg-green-50 text-green-700', no_show:'bg-red-50 text-red-700', closed:'bg-slate-100 text-slate-600' };
  // Parents see plain English, not the internal token.
  const statusLabel = { no_show: 'Not attended', completed: 'Demo done', new: 'Received' };

  return (
    <section className="rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold flex items-center gap-2"><CalendarClock className="h-5 w-5 text-brand-600"/>My demo requests</h2>
        <Link to="/book-demo" className="text-sm font-semibold text-brand-600 hover:text-brand-700">+ Book a demo</Link>
      </div>
      {isLoading ? <p className="text-sm text-slate-400">Loading…</p> : reqs.length ? (
        <ul className="divide-y divide-slate-100">
          {reqs.map(r => (
            <li key={r.id} className="py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-sm text-slate-800">{r.course?.name || r.subject || 'General enquiry'}</div>
                  <div className="text-xs text-slate-500">
                    {[r.student, r.grade, r.mode].filter(Boolean).join(' · ')}{r.created_at && ` · requested ${r.created_at}`}
                  </div>
                  {(r.assigned_tutor || r.requested_tutor) && (
                    <div className="text-xs text-slate-500">with {(r.assigned_tutor || r.requested_tutor).name}</div>
                  )}
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusColor[r.status]||'bg-slate-100 text-slate-600'}`}>{statusLabel[r.status] ?? r.status}</span>
              </div>
              <ProposedTimes demo={r} />
            </li>
          ))}
        </ul>
      ) : <p className="text-sm text-slate-500">No demo requests yet.</p>}
    </section>
  );
}

/**
 * Times the teacher has offered, and the family's answer.
 *
 * This is the family end of "in-app by default, phone as fallback": the parent
 * confirms a slot here rather than waiting for a call, and no contact details
 * have to be exchanged for the class to get booked.
 */
function ProposedTimes({ demo }) {
  const qc = useQueryClient();
  const open = (demo.slots ?? []).filter(s => s.status === 'proposed');
  const agreed = (demo.slots ?? []).find(s => s.status === 'accepted');

  const answer = useMutation({
    mutationFn: ({ slotId, yes }) => (yes ? acceptDemoSlot : declineDemoSlot)({ demoId: demo.id, slotId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-demo-requests'] }),
  });

  if (!agreed && open.length === 0) return null;

  // A confirmed time does NOT hide later offers. Returning early on `agreed`
  // meant a teacher asking to move the class proposed a new slot the family
  // could never see or answer — their request just vanished.
  const heading = agreed
    ? (open.length === 1 ? 'Your teacher has suggested a different time' : 'Your teacher has suggested other times')
    : (open.length === 1 ? 'Your teacher suggested a time' : 'Your teacher suggested some times');

  return (
    <>
      {agreed && (
        <p className="mt-1 text-xs font-semibold text-green-700">
          Confirmed for {new Date(agreed.starts_at.replace(' ', 'T')).toLocaleString()}
        </p>
      )}
      {open.length > 0 && (
    <div className="mt-2 rounded-lg bg-brand-50 p-2.5 ring-1 ring-brand-100">
      <p className="text-xs font-bold text-brand-800">{heading}</p>
      <ul className="mt-1.5 space-y-1.5">
        {open.map(s => (
          <li key={s.id} className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-800">
              {new Date(s.starts_at.replace(' ', 'T')).toLocaleString()}
            </span>
            {s.note && <span className="text-[11px] text-slate-500">{s.note}</span>}
            <span className="ml-auto flex gap-1.5">
              <button type="button" disabled={answer.isPending}
                onClick={() => answer.mutate({ slotId: s.id, yes: true })}
                className="rounded-md bg-brand-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-brand-700 disabled:opacity-60">
                That works
              </button>
              <button type="button" disabled={answer.isPending}
                onClick={() => answer.mutate({ slotId: s.id, yes: false })}
                className="rounded-md px-2.5 py-1 text-[11px] font-semibold text-slate-500 ring-1 ring-slate-200 hover:bg-white">
                Can't make it
              </button>
            </span>
          </li>
        ))}
      </ul>
      {answer.isError && <p className="mt-1 text-[11px] text-red-600">Could not save that — please try again.</p>}
    </div>
      )}
    </>
  );
}


function RescheduleBlock({ id, reschedules }) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ preferred_date:'', reason:'' });
  const send = useMutation({
    mutationFn: () => requestReschedule(id, { preferred_date: form.preferred_date || null, reason: form.reason || null }),
    onSuccess: () => { setForm({preferred_date:'',reason:''}); setShowForm(false); qc.invalidateQueries({queryKey:['my-enrollment', id]}); },
  });
  const badge = { pending:'bg-amber-50 text-amber-700', accepted:'bg-green-50 text-green-700', declined:'bg-red-50 text-red-700' };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Reschedule requests</h4>
        <button onClick={()=>setShowForm(s=>!s)} className="text-xs font-semibold text-brand-600 hover:text-brand-700">{showForm?'Cancel':'+ Request reschedule'}</button>
      </div>
      {reschedules.length > 0 && (
        <ul className="space-y-1 mb-2">
          {reschedules.map(r => (
            <li key={r.id} className="flex items-center justify-between gap-2 text-sm">
              <span className="text-slate-700 truncate">{[r.preferred_date && `Prefer ${r.preferred_date}`, r.reason].filter(Boolean).join(' — ') || `Requested ${r.created_at}`}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize shrink-0 ${badge[r.status]||'bg-slate-100'}`}>{r.status}</span>
            </li>
          ))}
        </ul>
      )}
      {showForm && (
        <form onSubmit={e=>{e.preventDefault();send.mutate();}} className="space-y-2 rounded-lg bg-white ring-1 ring-slate-100 p-3">
          <div className="grid grid-cols-2 gap-2">
            <input type="date" value={form.preferred_date} onChange={e=>setForm({...form,preferred_date:e.target.value})} className={inp}/>
            <input value={form.reason} onChange={e=>setForm({...form,reason:e.target.value})} placeholder="Reason (optional)" className={inp}/>
          </div>
          {send.isError && <p className="text-xs text-red-600">Could not send — check the date (today or later).</p>}
          <button disabled={send.isPending} className="rounded-lg bg-brand-600 text-white px-4 py-2 text-xs font-bold hover:bg-brand-700 disabled:opacity-60">
            {send.isPending?'Sending…':'Send to teacher'}
          </button>
        </form>
      )}
      {!showForm && reschedules.length === 0 && <p className="text-xs text-slate-400">Need to move a class? Send your teacher a reschedule request.</p>}
    </div>
  );
}

function TeacherReschedulesCard() {
  const qc = useQueryClient();
  const { data: items = [], isLoading } = useQuery({ queryKey:['teacher-reschedules'], queryFn: fetchTeacherReschedules });
  const act = useMutation({ mutationFn:({id,s})=>decideReschedule(id, s), onSuccess:()=>qc.invalidateQueries({queryKey:['teacher-reschedules']}) });
  const badge = { pending:'bg-amber-50 text-amber-700', accepted:'bg-green-50 text-green-700', declined:'bg-red-50 text-red-700' };
  const pending = items.filter(r=>r.status==='pending');
  const past = items.filter(r=>r.status!=='pending').slice(0,5);

  return (
    <section className="rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm p-6">
      <h2 className="text-lg font-bold flex items-center gap-2 mb-1"><CalendarClock className="h-5 w-5 text-brand-600"/>Reschedule requests</h2>
      <p className="text-xs text-slate-500 mb-4">Parents' requests to move a class — accept or decline, and they're notified instantly.</p>
      {isLoading ? <p className="text-sm text-slate-400">Loading…</p> : pending.length || past.length ? (
        <ul className="space-y-2">
          {pending.map(r => (
            <li key={r.id} className="rounded-lg ring-1 ring-slate-100 px-3 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-semibold text-sm text-slate-800">{r.student || 'Student'}{r.course && <span className="text-slate-400 font-normal"> · {r.course}</span>}</div>
                  <div className="text-xs text-slate-500">{[r.preferred_date && `Prefers ${r.preferred_date}`, r.reason].filter(Boolean).join(' — ') || `Requested ${r.created_at}`}</div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button disabled={act.isPending} onClick={()=>act.mutate({id:r.id,s:'accepted'})} className="rounded-md bg-green-600 text-white px-2.5 py-1.5 text-xs font-bold hover:bg-green-700 disabled:opacity-60">Accept</button>
                  <button disabled={act.isPending} onClick={()=>act.mutate({id:r.id,s:'declined'})} className="rounded-md ring-1 ring-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60">Decline</button>
                </div>
              </div>
            </li>
          ))}
          {past.map(r => (
            <li key={r.id} className="flex items-center justify-between gap-2 px-3 py-1.5 text-sm opacity-70">
              <span className="text-slate-600 truncate">{r.student}{r.preferred_date && ` · ${r.preferred_date}`}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${badge[r.status]}`}>{r.status}</span>
            </li>
          ))}
        </ul>
      ) : <p className="text-sm text-slate-500">No reschedule requests.</p>}
    </section>
  );
}

function StudentsCard() {
  const qc = useQueryClient();
  const { data: students = [], isLoading } = useQuery({ queryKey:['students'], queryFn: fetchStudents });
  const [form, setForm] = useState({ name:'', grade:'', board:'', subjects:'' });
  const [err, setErr] = useState('');
  const create = useMutation({
    mutationFn: () => createStudent(form),
    onSuccess: () => { setForm({name:'',grade:'',board:'',subjects:''}); setErr(''); qc.invalidateQueries({queryKey:['students']}); },
    onError: (e) => setErr(Object.values(e?.response?.data?.errors||{})[0]?.[0] || 'Could not add student.'),
  });
  const remove = useMutation({ mutationFn: deleteStudent, onSuccess: () => qc.invalidateQueries({queryKey:['students']}) });
  const set = k => e => setForm({...form,[k]:e.target.value});

  return (
    // id + scroll-mt so "Add a student" in Getting started lands here with the
    // heading clear of the sticky header rather than under it.
    <section id="students" className="scroll-mt-24 rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm p-6">
      <h2 className="text-lg font-bold flex items-center gap-2 mb-4"><UserPlus className="h-5 w-5 text-brand-600"/>My students</h2>

      {isLoading ? <p className="text-sm text-slate-400">Loading…</p> : students.length ? (
        <ul className="space-y-2 mb-5">
          {students.map(s => <ParentStudentRow key={s.id} s={s} onRemove={()=>remove.mutate(s.id)} />)}
        </ul>
      ) : <p className="text-sm text-slate-500 mb-5">No students yet. Add your child below.</p>}

      {err && <div className="mb-3 rounded-md bg-red-50 text-red-700 text-xs p-2">{err}</div>}
      <form onSubmit={e=>{e.preventDefault();create.mutate();}} className="space-y-2">
        <input required placeholder="Student name" value={form.name} onChange={set('name')} className={inp}/>
        <div className="grid grid-cols-3 gap-2">
          <input placeholder="Grade" value={form.grade} onChange={set('grade')} className={inp}/>
          <input placeholder="Board" value={form.board} onChange={set('board')} className={inp}/>
          <input placeholder="Subjects" value={form.subjects} onChange={set('subjects')} className={inp}/>
        </div>
        <button disabled={create.isPending} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 text-white px-4 py-2 text-sm font-bold hover:bg-brand-700 disabled:opacity-60">
          <Plus className="h-4 w-4"/> {create.isPending?'Adding…':'Add student'}
        </button>
      </form>
    </section>
  );
}

function ParentStudentRow({ s, onRemove }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="rounded-lg ring-1 ring-slate-100 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2">
        <button onClick={()=>setOpen(o=>!o)} className="flex-1 min-w-0 text-left">
          <div className="font-semibold text-sm text-slate-800 flex items-center gap-1.5">
            {s.name}
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-600"><Award className="h-3 w-3"/>{open?'Hide portfolio':'Portfolio'}</span>
          </div>
          <div className="text-xs text-slate-500">{[s.grade, s.board, s.subjects].filter(Boolean).join(' · ') || 'No details yet'}</div>
        </button>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={()=>setOpen(o=>!o)} className="p-1.5 text-slate-400 hover:text-brand-600" title="Portfolio">{open ? <ChevronUp className="h-4 w-4"/> : <ChevronDown className="h-4 w-4"/>}</button>
          <button onClick={onRemove} className="p-1.5 text-slate-400 hover:text-red-600" title="Remove"><Trash2 className="h-4 w-4"/></button>
        </div>
      </div>
      {open && <div className="border-t border-slate-100 bg-slate-50"><PortfolioPanel studentId={s.id} /></div>}
    </li>
  );
}

function UpcomingClassesCard() {
  const { data: items = [], isLoading } = useQuery({ queryKey:['upcoming-classes'], queryFn: fetchUpcomingClasses });
  return (
    <section className="rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm p-6">
      <h2 className="text-lg font-bold flex items-center gap-2 mb-4"><Calendar className="h-5 w-5 text-brand-600"/>Upcoming classes</h2>
      {isLoading ? <p className="text-sm text-slate-400">Loading…</p> : items.length ? (
        <ul className="divide-y divide-slate-100">
          {items.map(c => (
            <li key={c.id} className="flex items-center justify-between gap-2 py-2.5">
              <div className="min-w-0">
                <div className="font-semibold text-sm text-slate-800 truncate">{c.topic}</div>
                <div className="text-xs text-slate-500">{[c.student, c.course, c.teacher && `with ${c.teacher}`].filter(Boolean).join(' · ')}</div>
              </div>
              <span className="shrink-0 rounded-full bg-blue-50 text-blue-700 px-2.5 py-0.5 text-xs font-semibold">{c.date}</span>
            </li>
          ))}
        </ul>
      ) : <p className="text-sm text-slate-500">No classes scheduled yet — your teacher schedules them in the class log.</p>}
    </section>
  );
}

function ExamUpdatesCard() {
  const { data: items = [], isLoading } = useQuery({ queryKey:['exam-updates'], queryFn: fetchExamUpdates });
  if (!isLoading && !items.length) return null; // hide the card until staff publish something
  return (
    <section className="rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm p-6">
      <h2 className="text-lg font-bold flex items-center gap-2 mb-4"><Megaphone className="h-5 w-5 text-brand-600"/>Exam updates</h2>
      {isLoading ? <p className="text-sm text-slate-400">Loading…</p> : (
        <ul className="space-y-3">
          {items.map(u => (
            <li key={u.id} className="rounded-lg ring-1 ring-slate-100 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="font-semibold text-sm text-slate-800">{u.title}</div>
                {u.exam_date && <span className="shrink-0 rounded-full bg-amber-50 text-amber-700 px-2.5 py-0.5 text-xs font-semibold">{u.exam_date}</span>}
              </div>
              {u.body && <p className="text-xs text-slate-500 mt-1 leading-relaxed">{u.body}</p>}
              {u.link_url && <a href={u.link_url} target="_blank" rel="noopener noreferrer" className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"><Link2 className="h-3.5 w-3.5"/>Learn more</a>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function KycCard() {
  const qc = useQueryClient();
  const fileRef = useRef();
  const [type, setType] = useState('aadhaar');
  const [err, setErr] = useState('');
  const { data: docs = [], isLoading } = useQuery({ queryKey:['kyc'], queryFn: fetchKyc });
  const upload = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append('type', type);
      fd.append('file', fileRef.current.files[0]);
      return uploadKyc(fd);
    },
    onSuccess: () => { if(fileRef.current) fileRef.current.value=''; setErr(''); qc.invalidateQueries({queryKey:['kyc']}); },
    onError: (e) => setErr(Object.values(e?.response?.data?.errors||{})[0]?.[0] || 'Upload failed.'),
  });
  const remove = useMutation({ mutationFn: deleteKyc, onSuccess: () => qc.invalidateQueries({queryKey:['kyc']}) });
  const statusColor = { pending:'bg-amber-50 text-amber-700', verified:'bg-green-50 text-green-700', rejected:'bg-red-50 text-red-700' };

  return (
    <section className="rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm p-6">
      <h2 className="text-lg font-bold flex items-center gap-2 mb-1"><ShieldCheck className="h-5 w-5 text-brand-600"/>KYC documents</h2>
      <p className="text-xs text-slate-500 mb-4">Upload Aadhaar, PAN, a photo or certificates. Files are stored privately and reviewed by our team.</p>

      {isLoading ? <p className="text-sm text-slate-400">Loading…</p> : docs.length ? (
        <ul className="space-y-2 mb-5">
          {docs.map(d => (
            <li key={d.id} className="flex items-center justify-between rounded-lg ring-1 ring-slate-100 px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="h-4 w-4 text-slate-400 shrink-0"/>
                <div className="min-w-0">
                  <div className="font-semibold text-sm text-slate-800 capitalize">{d.type}</div>
                  <div className="text-xs text-slate-500 truncate">{d.original_name}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusColor[d.status]||'bg-slate-100 text-slate-600'}`}>{d.status}</span>
                <button onClick={()=>remove.mutate(d.id)} className="p-1.5 text-slate-400 hover:text-red-600" title="Remove"><Trash2 className="h-4 w-4"/></button>
              </div>
            </li>
          ))}
        </ul>
      ) : <p className="text-sm text-slate-500 mb-5">No documents uploaded yet.</p>}

      {err && <div className="mb-3 rounded-md bg-red-50 text-red-700 text-xs p-2">{err}</div>}
      <form onSubmit={e=>{e.preventDefault(); if(fileRef.current?.files[0]) upload.mutate();}} className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <select value={type} onChange={e=>setType(e.target.value)} className={inp}>
            {['aadhaar','pan','photo','certificate','other'].map(t=><option key={t} value={t} className="capitalize">{t}</option>)}
          </select>
          <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.pdf" required className="text-sm text-slate-600 file:mr-2 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-semibold"/>
        </div>
        <button disabled={upload.isPending} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 text-white px-4 py-2 text-sm font-bold hover:bg-brand-700 disabled:opacity-60">
          <Upload className="h-4 w-4"/> {upload.isPending?'Uploading…':'Upload document'}
        </button>
        <p className="text-xs text-slate-400">JPG, PNG or PDF · up to 5 MB.</p>
      </form>
    </section>
  );
}
