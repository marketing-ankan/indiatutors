import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FolderOpen, Plus, Trash2, Sparkles, Link2, Download, GraduationCap, ScrollText } from 'lucide-react';
import {
  fetchTeacherMaterialRoster, fetchTeacherMaterialFilters, fetchTeacherMaterialDetail,
  grantTeacherCourse, revokeTeacherCourseGrant, fetchAdminCourses,
  createCourseMaterial, updateCourseMaterial, deleteCourseMaterial, downloadCourseMaterial,
} from '../../lib/api.js';
import {
  AdminTable, Chips, SearchBox, Pager, StatusBadge, Modal, ConfirmDialog,
  btnGhost, btnPrimary, inpSm, errText, day,
} from './AdminUI.jsx';
import HandoverTrail from './HandoverTrail.jsx';

/**
 * Teachers by subject and category, what they are teaching next, what they have
 * already taught — and the one screen where staff can actually hand them a file.
 *
 * course_materials and its admin CRUD already existed; nothing in the app ever
 * called them, so material could only be uploaded by someone with a database
 * client. That is the gap this closes.
 *
 * Entitlement is the other half. A teacher sees a course's material only while
 * they hold an active enrolment on that course, which is backwards for
 * preparation: an approved teacher with no student yet gets nothing to read.
 * The grants written here are the deliberate override — "give this teacher the
 * syllabus" is one click, and it is recorded like every other console mutation.
 *
 * Two views, one tab. This one is the doing; HandoverTrail is the record of it,
 * including the second hop staff never touch — the teacher passing one file to
 * one student. They sit together because a grant made here is the first row of
 * that trail.
 */

// course_materials' own vocabulary. Deliberately NOT the teacher-upload list in
// the dashboard (which has lesson_plan and homework): these are two tables with
// two type columns, and offering a value the server rejects is worse than a
// shorter menu.
const MATERIAL_TYPES = [
  { key: 'ppt', label: 'PPT' },
  { key: 'pdf', label: 'PDF' },
  { key: 'note', label: 'Note' },
  { key: 'question_bank', label: 'Question bank' },
  { key: 'other', label: 'Other' },
];

// Where a course came from decides whether removing the grant actually removes
// anything — an enrolment entitles the teacher on its own.
const SOURCE_LABEL = {
  grant: 'Given by staff',
  enrolment: 'From an enrolment',
  both: 'Granted + enrolled',
};

// The server's own ceiling and allow-list (CourseMaterialController::store), so
// an oversized or unsupported file is refused by the picker instead of after a
// full upload.
const MAX_KB = 10240;
const ACCEPT = '.pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png';

const kb = n => (n == null ? null : n >= 1024 ? `${(n / 1024).toFixed(1)} MB` : `${n} KB`);
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

// Built from the local clock rather than toISOString(), which would hand back
// yesterday's date for anyone east of UTC for most of their working day.
const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// A long subject list would push 40 chips onto the row; the search box reaches
// the tail. Counts come from the API — summing them here would double-count a
// teacher who teaches two of them.
const CHIP_LIMIT = 12;

export default function MaterialsTab() {
  const [view, setView] = useState('teachers');
  const [category, setCategory] = useState('');
  const [subject, setSubject] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(null);

  // The roster's filters and page survive the switch because this component
  // stays mounted either way; the modal does not, because it is transient and
  // returning to a dialog you left behind reads as a bug.
  const switchTo = v => { setView(v); setOpen(null); };

  // Idle while the trail is showing, rather than refetching a roster nobody is
  // looking at. What was already fetched stays in the cache, so coming back is
  // instant.
  const onTeachers = view === 'teachers';

  const filters = useQuery({
    queryKey: ['admin-teacher-material-filters'],
    queryFn: fetchTeacherMaterialFilters,
    staleTime: 60_000,
    enabled: onTeachers,
  });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin-teacher-materials', category, subject, q, page],
    queryFn: () => fetchTeacherMaterialRoster({ category, subject, q, page }),
    placeholderData: prev => prev,
    enabled: onTeachers,
  });

  // Nothing below this line runs for the trail: it is a different screen over a
  // different table, sharing only the tab it is reached from.
  if (!onTeachers) {
    return (
      <div className="mt-5">
        <ViewSwitch value={view} onChange={switchTo} />
        <div className="mt-4"><HandoverTrail /></div>
      </div>
    );
  }

  const rows = data?.data ?? [];
  const reset = fn => v => { fn(v); setPage(1); };

  const catOptions = [{ key: '', label: 'All categories' }, ...(filters.data?.categories ?? [])];
  // Keep the active chip visible even when it falls outside the top slice,
  // otherwise the row silently stops showing what is being filtered on.
  const allSubjects = filters.data?.subjects ?? [];
  const topSubjects = allSubjects.slice(0, CHIP_LIMIT);
  const shownSubjects = subject && !topSubjects.some(s => s.key === subject)
    ? [...topSubjects, ...allSubjects.filter(s => s.key === subject)]
    : topSubjects;
  const subOptions = [{ key: '', label: 'All subjects' }, ...shownSubjects];

  return (
    <div className="mt-5">
      <ViewSwitch value={view} onChange={switchTo} />

      <div className="mt-4 space-y-2">
        {filters.isError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
            Could not load the subject and category chips. The search box below still works.
          </p>
        )}
        {filters.isLoading && <p className="text-xs text-slate-400">Loading subjects and categories…</p>}

        <Chips options={catOptions} value={category} onChange={reset(setCategory)} />
        <Chips options={subOptions} value={subject} onChange={reset(setSubject)} />
        <div className="flex flex-wrap items-center gap-3">
          <SearchBox value={q} onChange={reset(setQ)} placeholder="Search teachers, subjects…" className="sm:max-w-xs" />
          {allSubjects.length > shownSubjects.length && (
            <span className="text-xs text-slate-400">
              {allSubjects.length - shownSubjects.length} more subjects — search for one by name.
            </span>
          )}
        </div>
      </div>

      {isError && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errText(error, 'Could not load the roster.')}</p>
      )}

      <AdminTable
        cols={['Teacher', 'Subjects', 'Upcoming', 'Classes taken', 'Material', 'Actions']}
        rows={rows}
        loading={isLoading}
        empty={isError ? 'The roster did not load — this is not an empty result.' : 'No teachers match these filters.'}
        minWidth={1040}
        renderRow={r => (
          <tr key={r.id} className="align-top">
            <td className="px-3 py-3">
              <div className="font-semibold text-slate-800">{r.name}</div>
              <div className="text-xs text-slate-500">{r.email}</div>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${r.is_listed ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                  {r.is_listed ? 'Listed' : 'Unlisted'}
                </span>
                {r.city && <span className="text-[11px] text-slate-400">{r.city}</span>}
              </div>
            </td>

            <td className="px-3 py-3 text-slate-600">
              {r.subjects?.length ? r.subjects.join(', ') : <span className="text-slate-400">—</span>}
              {/* A subject the matcher could not place is called out rather than
                  counted as zero. It says "no match", not "no course": matching
                  reads course names one way, so a course can exist under a name
                  the subject never reaches. */}
              {r.unmatched_subjects?.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {r.unmatched_subjects.map(s => (
                    <span key={s} title="No course name matched this subject automatically — open Materials to search the catalogue"
                      className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                      {s} · no match
                    </span>
                  ))}
                </div>
              )}
              {r.categories?.length > 0 && (
                <div className="mt-1 text-[11px] text-slate-400">{r.categories.map(c => c.name).join(' · ')}</div>
              )}
            </td>

            <td className="px-3 py-3">
              <div className="text-base font-bold tabular-nums text-slate-800">{r.upcoming_count}</div>
              <div className="text-[11px] text-slate-400">next 14 days</div>
            </td>

            <td className="px-3 py-3">
              <div className="text-base font-bold tabular-nums text-slate-800">{r.classes_taken}</div>
              <div className="text-[11px] text-slate-400">
                {r.last_class_on ? `last ${day(r.last_class_on)}` : 'none logged'}
              </div>
            </td>

            <td className="px-3 py-3">
              {/* Zero files and zero linked courses are different problems:
                  one means nothing has been uploaded, the other means there is
                  nowhere to put it — a bare 0 would read as the first. The
                  count is published-only, so it says so: a staged draft leaves
                  this at 0, and an unqualified "0 files" reads as a failed
                  upload to the admin who just staged one. */}
              {r.courses_count === 0 ? (
                <span className="inline-block rounded bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">No course linked</span>
              ) : (
                <>
                  <div className="text-slate-700">{plural(r.materials_count, 'published file', 'published files')}</div>
                  <div className="text-[11px] text-slate-400">
                    across {plural(r.courses_count, 'course', 'courses')} · drafts not counted
                  </div>
                </>
              )}
            </td>

            <td className="px-3 py-3">
              <button onClick={() => setOpen(r)} className={btnGhost}>
                <FolderOpen className="h-3.5 w-3.5" />Materials
              </button>
            </td>
          </tr>
        )}
      />
      <Pager meta={data?.meta} page={page} setPage={setPage} />

      {open && (
        <TeacherMaterials
          tutorId={open.id}
          fallback={rows.find(r => r.id === open.id) ?? open}
          onClose={() => setOpen(null)}
        />
      )}
    </div>
  );
}

const VIEWS = [
  { key: 'teachers', label: 'Teachers', Icon: GraduationCap },
  { key: 'trail', label: 'Handover trail', Icon: ScrollText },
];

/**
 * Deliberately not a Chips row. The roster below already carries two of those,
 * and a third identical row that replaced the whole screen instead of filtering
 * it would be a trap — same control, opposite consequence. A segmented switch
 * reads as navigation.
 */
function ViewSwitch({ value, onChange }) {
  return (
    <div className="inline-flex rounded-xl bg-slate-100 p-1" role="group" aria-label="Materials view">
      {VIEWS.map(v => {
        const on = value === v.key;
        return (
          <button key={v.key} type="button" onClick={() => onChange(v.key)} aria-pressed={on}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold transition ${
              on ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <v.Icon className="h-3.5 w-3.5" />{v.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * One teacher: what is coming up, what has been taught, which courses they can
 * teach from, and the upload form that fills them.
 */
function TeacherMaterials({ tutorId, fallback, onClose }) {
  const qc = useQueryClient();
  const [revoking, setRevoking] = useState(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin-teacher-material-detail', tutorId],
    queryFn: () => fetchTeacherMaterialDetail(tutorId),
  });

  // The row behind the modal carries the counts this modal changes, so both
  // are refreshed together.
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['admin-teacher-material-detail', tutorId] });
    qc.invalidateQueries({ queryKey: ['admin-teacher-materials'] });
  };

  const grant = useMutation({
    mutationFn: (course_id) => grantTeacherCourse(tutorId, { course_id }),
    onSuccess: refresh,
  });
  const revoke = useMutation({
    mutationFn: revokeTeacherCourseGrant,
    onSuccess: () => { setRevoking(null); refresh(); },
  });

  // The mutation belongs to this modal and the dialog is a sibling of it, so a
  // failed remove would still be showing its error inside the NEXT course's
  // confirm box, before that course had been touched.
  const confirmRevoke = course => { revoke.reset(); setRevoking(course); };

  const teacher = data?.teacher ?? fallback;
  const courses = data?.courses ?? [];
  const suggested = data?.suggested ?? [];

  // "Recent" promises classes that have happened. Nothing stops a teacher
  // dating a log ahead, and those rows come back in this list as well as in
  // Upcoming — sorted newest-first they sit above real history and read as the
  // last class taken. A class that has not happened is shown once, under
  // Upcoming, which is the panel that means it. The empty line stays scoped to
  // "the latest logs": the server sends ten rows, so future ones crowding them
  // out is not evidence that nothing was ever held.
  const logged = data?.recent ?? [];
  const recent = logged.filter(c => !c.date || c.date <= todayIso());
  const allDatedAhead = logged.length > 0 && recent.length === 0;

  return (
    <>
      <Modal
        title={teacher.name}
        subtitle={[teacher.subjects?.join(', '), teacher.city].filter(Boolean).join(' · ') || null}
        onClose={onClose}
        wide
      >
        {isLoading && <p className="py-6 text-center text-sm text-slate-400">Loading this teacher’s classes and material…</p>}
        {isError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {errText(error, 'Could not load this teacher — nothing has been changed.')}
          </p>
        )}

        {data && (
          <div className="space-y-5">
            {/* The matcher can only report what it failed to match. It reads
                course names one way — "Spanish Language" never reaches the
                course "Spanish" — so a miss is not a verdict on the catalogue,
                and saying it is has staff duplicate a course that exists. */}
            {teacher.unmatched_subjects?.length > 0 && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
                <strong>{teacher.unmatched_subjects.join(', ')} did not match a course automatically.</strong>{' '}
                Matching is on course names, so a course may exist under a different one — search the
                catalogue below before treating {teacher.unmatched_subjects.length === 1 ? 'it' : 'them'} as a gap.
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <ClassList
                title="Upcoming classes"
                note="next 14 days"
                items={data.upcoming}
                empty="No class scheduled in the next 14 days."
                render={c => (
                  <>
                    <span className="font-semibold text-slate-800">{day(c.date)}{c.time ? ` · ${c.time}` : ''}</span>
                    <span className="text-slate-500">
                      {[c.student, c.course].filter(Boolean).join(' · ')}
                      {c.note ? ` — ${c.note}` : ''}
                    </span>
                  </>
                )}
              />
              <ClassList
                title="Recent classes"
                note="most recently held"
                items={recent}
                empty={allDatedAhead
                  ? 'Every class in this teacher’s latest logs is dated ahead — they are listed under Upcoming.'
                  : 'No class has been logged for this teacher yet.'}
                render={c => (
                  <>
                    <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                      {day(c.date)} <StatusBadge status={c.status} />
                    </span>
                    <span className="text-slate-500">
                      {[c.topic, c.student, c.course].filter(Boolean).join(' · ')}
                    </span>
                  </>
                )}
              />
            </div>

            <section>
              <h4 className="text-sm font-bold text-slate-800">Courses this teacher can teach from</h4>
              <p className="mt-0.5 text-xs text-slate-500">
                Material is entitled per course. Anything added here is visible to this teacher once published.
              </p>

              {courses.length === 0 ? (
                suggested.length === 0 ? (
                  // Nothing matched — which is all the matcher knows. Whether
                  // the catalogue carries the subject under another name is a
                  // question only the search below can answer.
                  <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
                    <strong>Nothing matched this teacher’s subjects automatically</strong>
                    {teacher.subjects?.length ? ` (${teacher.subjects.join(', ')})` : ''}.
                    Search the catalogue below and give a course by hand — subjects are matched against
                    course names, so one may be listed under a name the subject does not reach. Add a new
                    course only once that search comes back empty.
                  </div>
                ) : (
                  <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500 ring-1 ring-slate-100">
                    No course is linked yet. Give one from the suggestions below, and material can be
                    attached to it straight away.
                  </p>
                )
              ) : (
                <div className="mt-3 space-y-3">
                  {courses.map(c => (
                    <CourseCard key={c.id} course={c} onChanged={refresh} onRevoke={() => confirmRevoke(c)} />
                  ))}
                </div>
              )}
            </section>

            <section>
              <h4 className="flex items-center gap-1.5 text-sm font-bold text-slate-800">
                <Sparkles className="h-4 w-4 text-brand-600" />Suggested courses
              </h4>
              {suggested.length === 0 ? (
                <p className="mt-2 text-xs text-slate-500">
                  {courses.length > 0
                    ? 'Every course matching this teacher’s subjects is already linked.'
                    : 'Nothing matched automatically — search the catalogue below.'}
                </p>
              ) : (
                <>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Matched from the subjects on this teacher’s profile. Giving a course lets them
                    open its material without waiting for an enrolment.
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {suggested.map(s => (
                      <li key={s.id} className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg bg-slate-50 px-3 py-2 text-xs">
                        <strong className="text-slate-800">{s.name}</strong>
                        <span className="rounded-full bg-white px-2 py-0.5 font-semibold text-slate-500 ring-1 ring-slate-200">
                          matched on {s.matched_on}
                        </span>
                        {s.exact && (
                          <span className="rounded-full bg-brand-50 px-2 py-0.5 font-semibold text-brand-700">exact</span>
                        )}
                        <button type="button" disabled={grant.isPending}
                          onClick={() => grant.mutate(s.id)}
                          className={btnGhost + ' ml-auto'}>
                          <Plus className="h-3.5 w-3.5" />Give this course
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              <CourseSearch
                linked={courses.map(c => c.id)}
                busy={grant.isPending}
                onGive={id => grant.mutate(id)}
              />

              {grant.isError && <p className="mt-2 text-xs text-red-600">{errText(grant.error)}</p>}
            </section>
          </div>
        )}
      </Modal>

      {revoking && (
        <ConfirmDialog
          title="Remove this course?"
          message={revoking.source === 'both'
            ? `${teacher.name} also has an enrolment on ${revoking.name}, which entitles them to the same material — removing the grant will not cut off their access on its own.`
            : `${teacher.name} will no longer see ${revoking.name}'s material, including the files listed under it. The files themselves are not deleted.`}
          confirmLabel="Remove"
          busy={revoke.isPending}
          error={revoke.isError ? errText(revoke.error) : ''}
          onConfirm={() => revoke.mutate(revoking.grant_id)}
          onClose={() => confirmRevoke(null)}
        />
      )}
    </>
  );
}

function ClassList({ title, note, items = [], empty, render }) {
  return (
    <div className="rounded-lg ring-1 ring-slate-100 p-3">
      <p className="text-xs font-bold text-slate-700">{title} <span className="font-normal text-slate-400">· {note}</span></p>
      {items.length === 0 ? (
        <p className="mt-2 text-xs text-slate-500">{empty}</p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {items.map((c, i) => (
            <li key={`${c.date}-${i}`} className="flex flex-col gap-0.5 text-xs">{render(c)}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Give any course in the catalogue, matched or not.
 *
 * Suggestions are deliberately under-inclusive — subjects are matched against
 * course names one way, so "Spanish Language" never reaches the course
 * "Spanish". Until this existed a miss left staff with no button to press and
 * an amber panel that read as a missing course, so the fix on offer was to
 * create a duplicate. A search is the only thing that can tell a naming
 * mismatch from a real catalogue gap.
 */
function CourseSearch({ linked, busy, onGive }) {
  const [q, setQ] = useState('');
  const term = q.trim();

  const { data, isFetching } = useQuery({
    queryKey: ['admin-courses', 'give-to-teacher', term],
    queryFn: () => fetchAdminCourses({ q: term }),
    enabled: term.length >= 2,
    placeholderData: prev => prev,
  });

  // Courses already linked are dropped rather than shown disabled — each one
  // has its own card higher up this same screen.
  const hits = (data?.data ?? []).filter(c => !linked.includes(c.id));
  const shown = hits.slice(0, 8);
  const total = data?.meta?.total ?? 0;

  return (
    <div className="mt-4 rounded-lg bg-slate-50 p-3">
      <p className="text-xs font-bold text-slate-700">Not suggested? Give any course by hand</p>
      <div className="mt-2">
        <SearchBox value={q} onChange={setQ} placeholder="Search the catalogue by course name…" className="sm:max-w-sm" />
      </div>

      {term.length < 2 ? (
        <p className="mt-2 text-[11px] text-slate-400">Type at least two letters of a course name.</p>
      ) : isFetching && !data ? (
        <p className="mt-2 text-xs text-slate-500">Searching the catalogue…</p>
      ) : shown.length === 0 ? (
        <p className="mt-2 text-xs text-slate-500">
          {(data?.data?.length ?? 0) > 0
            ? `Every course named like “${term}” is already linked to this teacher.`
            : `No course in the catalogue is named like “${term}”.`}
        </p>
      ) : (
        <>
          <ul className="mt-2 space-y-1.5">
            {shown.map(c => (
              <li key={c.id} className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg bg-white px-3 py-2 text-xs ring-1 ring-slate-200">
                <strong className="text-slate-800">{c.name}</strong>
                {c.categories?.length > 0 && (
                  <span className="text-[11px] text-slate-400">{c.categories.map(x => x.name).join(' · ')}</span>
                )}
                {!c.is_published && (
                  <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-700">Draft</span>
                )}
                <button type="button" disabled={busy} onClick={() => onGive(c.id)} className={btnGhost + ' ml-auto'}>
                  <Plus className="h-3.5 w-3.5" />Give this course
                </button>
              </li>
            ))}
          </ul>
          {total > shown.length && (
            <p className="mt-1.5 text-[11px] text-slate-400">
              {plural(total, 'course matches', 'courses match')} “{term}” — narrow the search to see the rest.
            </p>
          )}
        </>
      )}
    </div>
  );
}

function CourseCard({ course, onChanged, onRevoke }) {
  const [adding, setAdding] = useState(false);
  const materials = course.materials ?? [];

  return (
    <div className="rounded-lg ring-1 ring-slate-200 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <strong className="text-sm text-slate-800">{course.name}</strong>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
          {SOURCE_LABEL[course.source] ?? course.source}
        </span>
        <span className="text-[11px] text-slate-400">
          {course.students > 0 ? plural(course.students, 'student', 'students') : 'no students yet'}
        </span>
        <div className="ml-auto flex gap-1.5">
          <button type="button" onClick={() => setAdding(v => !v)} className={btnGhost}>
            <Plus className="h-3.5 w-3.5" />Add material
          </button>
          {/* Only a grant can be removed — an enrolment's entitlement is not
              this tab's to withdraw. */}
          {course.grant_id != null && (
            <button type="button" onClick={onRevoke} className={btnGhost + ' hover:text-red-600 hover:ring-red-200'}>
              Remove
            </button>
          )}
        </div>
      </div>

      {materials.length === 0 ? (
        <p className="mt-2 text-xs text-slate-500">No material on this course yet.</p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {materials.map(m => <MaterialRow key={m.id} m={m} onChanged={onChanged} />)}
        </ul>
      )}

      {adding && (
        <AddMaterialForm courseId={course.id} onDone={() => { setAdding(false); onChanged(); }} onCancel={() => setAdding(false)} />
      )}
    </div>
  );
}

function MaterialRow({ m, onChanged }) {
  const [confirming, setConfirming] = useState(false);
  const [opening, setOpening] = useState(false);
  const [openError, setOpenError] = useState('');

  // The file sits on the private disk behind a bearer token, so it is pulled as
  // a blob rather than linked. Without this the only way to check a file you
  // just uploaded was to delete it and upload again — against a dialog that
  // warns the delete cannot be undone.
  const openFile = async () => {
    setOpening(true);
    setOpenError('');
    try {
      await downloadCourseMaterial(m.id, m.original_name || m.title);
    } catch (e) {
      setOpenError(errText(e, 'Could not open this file.'));
    } finally {
      setOpening(false);
    }
  };

  const publish = useMutation({
    mutationFn: () => updateCourseMaterial(m.id, { is_published: !m.is_published }),
    onSuccess: onChanged,
  });
  const remove = useMutation({
    mutationFn: () => deleteCourseMaterial(m.id),
    onSuccess: () => { setConfirming(false); onChanged(); },
  });

  return (
    <li className="flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-semibold text-slate-800">{m.title}</span>
        <span className="block text-[11px] text-slate-400">
          {[kb(m.size_kb), m.uploaded_at ? day(m.uploaded_at) : null].filter(Boolean).join(' · ')}
          {!m.has_file && m.link_url ? ' · link' : ''}
        </span>
      </span>
      <span className="rounded bg-white px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-500 ring-1 ring-slate-200">{m.type}</span>
      {!m.is_published && (
        <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-700">Draft</span>
      )}
      {m.has_file && (
        <button type="button" disabled={opening} onClick={openFile} className={btnGhost}>
          <Download className="h-3.5 w-3.5" />{opening ? 'Opening…' : 'Open'}
        </button>
      )}
      {m.link_url && (
        <a href={m.link_url} target="_blank" rel="noopener noreferrer" className={btnGhost}>
          <Link2 className="h-3.5 w-3.5" />{m.has_file ? 'Link' : 'Open'}
        </a>
      )}
      <button type="button" disabled={publish.isPending} onClick={() => publish.mutate()} className={btnGhost}>
        {m.is_published ? 'Unpublish' : 'Publish'}
      </button>
      <button type="button" onClick={() => setConfirming(true)} title="Delete this material" aria-label="Delete this material"
        className={btnGhost + ' hover:text-red-600 hover:ring-red-200'}>
        <Trash2 className="h-3.5 w-3.5" />
      </button>
      {publish.isError && <span className="w-full text-[11px] text-red-600">{errText(publish.error)}</span>}
      {openError && <span className="w-full text-[11px] text-red-600">{openError}</span>}

      {confirming && (
        <ConfirmDialog
          title="Delete this material?"
          message={`“${m.title}” is removed for every teacher and family entitled to this course. This cannot be undone.`}
          busy={remove.isPending}
          error={remove.isError ? errText(remove.error) : ''}
          onConfirm={() => remove.mutate()}
          onClose={() => setConfirming(false)}
        />
      )}
    </li>
  );
}

/**
 * The upload itself, straight onto the existing admin course-materials endpoint.
 *
 * The server refuses a submission carrying neither a file nor a link, so the
 * button holds to the same rule: a title-only click could only ever come back a
 * 422, and a form that lets you press send on a guaranteed failure is lying
 * about its own state. Size and file type are checked here for the same reason —
 * a 40MB file otherwise uploads in full before the server rejects it.
 */
function AddMaterialForm({ courseId, onDone, onCancel }) {
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [form, setForm] = useState({ type: 'ppt', title: '', description: '', link_url: '', is_published: true });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // An oversized pick is cleared, not just flagged: left in the input it would
  // still ride along on submit and fail at the server.
  const pickFile = e => {
    const picked = e.target.files[0] ?? null;
    const sizeKb = picked ? Math.round(picked.size / 1024) : 0;
    if (picked && sizeKb > MAX_KB) {
      setFileError(`${picked.name} is ${kb(sizeKb)} — the limit is ${kb(MAX_KB)}.`);
      e.target.value = '';
      setFile(null);
      return;
    }
    setFileError('');
    setFile(picked);
  };

  const save = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append('course_id', courseId);
      fd.append('type', form.type);
      fd.append('title', form.title);
      if (form.description) fd.append('description', form.description);
      if (form.link_url) fd.append('link_url', form.link_url);
      if (file) fd.append('file', file);
      fd.append('is_published', form.is_published ? '1' : '0');
      return createCourseMaterial(fd);
    },
    onSuccess: onDone,
  });

  return (
    <form onSubmit={e => { e.preventDefault(); save.mutate(); }} className="mt-3 rounded-lg bg-slate-50 p-3">
      <div className="flex flex-wrap gap-2">
        <select value={form.type} onChange={e => set('type', e.target.value)} className={inpSm + ' bg-white'}>
          {MATERIAL_TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
        </select>
        <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Title"
          className={inpSm + ' flex-1 min-w-[160px] bg-white'} />
      </div>
      <input value={form.description} onChange={e => set('description', e.target.value)} placeholder="Description (optional)"
        className={inpSm + ' mt-2 w-full bg-white'} />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <input type="file" accept={ACCEPT} onChange={pickFile}
          className="max-w-full text-xs text-slate-600 file:mr-2 file:rounded-md file:border-0 file:bg-slate-200 file:px-2 file:py-1 file:text-xs file:font-semibold file:text-slate-700" />
        <span className="text-[11px] text-slate-400">or</span>
        <input value={form.link_url} onChange={e => set('link_url', e.target.value)} placeholder="Paste a link"
          className={inpSm + ' flex-1 min-w-[160px] bg-white'} />
      </div>
      <p className="mt-1 text-[11px] text-slate-400">
        A file or a link is required. Up to {kb(MAX_KB)}: PDF, PPT, Word, Excel, text or an image.
      </p>
      {fileError && <p className="mt-1 text-[11px] text-red-600">{fileError}</p>}
      <label className="mt-2 flex items-center gap-2 text-xs text-slate-600">
        <input type="checkbox" checked={form.is_published} onChange={e => set('is_published', e.target.checked)}
          className="h-3.5 w-3.5 rounded border-slate-300" />
        Publish now — unpublished material stays staff-only.
      </label>

      {save.isError && <p className="mt-2 text-xs text-red-600">{errText(save.error, 'Could not add this material.')}</p>}

      <div className="mt-3 flex flex-wrap gap-2">
        <button type="submit" disabled={save.isPending || !form.title.trim() || (!file && !form.link_url.trim())} className={btnPrimary}>
          {save.isPending ? 'Adding…' : 'Add material'}
        </button>
        <button type="button" onClick={onCancel} className={btnGhost}>Cancel</button>
      </div>
    </form>
  );
}
