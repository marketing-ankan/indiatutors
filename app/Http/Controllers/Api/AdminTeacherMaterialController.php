<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\ClassAbsence;
use App\Models\ClassLog;
use App\Models\Course;
use App\Models\CourseMaterial;
use App\Models\Enrollment;
use App\Models\EnrollmentSchedule;
use App\Models\TeacherCourseGrant;
use App\Models\Tutor;
use App\Support\SubjectCourseMap;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

// The console's answer to "which teacher needs which material, and have they
// got it?" — teachers filtered by subject and root category, each row carrying
// what they have coming up, what they have already taught, and how many company
// files they can actually open.
//
// It exists because course_materials had admin CRUD and no way to reach it: an
// admin could not upload a PPT or hand one to a teacher through any screen. The
// harder half is entitlement. A teacher reads material for courses they teach,
// derived from active enrolments — so the teacher who most needs the syllabus,
// the one approved last week with no students yet, is entitled to nothing. That
// is what teacher_course_grants and the POST below are for.
//
// Every figure here is counted from a row that exists. Where nothing can be
// counted the field is 0 or null and the UI says why — a subject the catalogue
// does not carry is reported in unmatched_subjects rather than quietly shown as
// a teacher with no courses. A subject the catalogue DOES carry but no single
// course is headed by goes in ambiguous_subjects instead, with those courses
// attached: "no course covers Dance" is a false statement about a catalogue
// holding seven of them.
class AdminTeacherMaterialController extends Controller
{
    /** The window "upcoming" means, shared by the count and the list so they agree. */
    private const HORIZON_DAYS = 14;

    private const PER_PAGE = 20;

    public function index(Request $request)
    {
        $subject  = trim($request->string('subject')->toString());
        $category = trim($request->string('category')->toString());
        $search   = trim($request->string('q')->toString());

        $rows = $this->roster()
            ->when($subject !== '', fn (Collection $c) => $c->filter(fn ($r) => in_array(
                mb_strtolower($subject),
                array_map('mb_strtolower', $r['subjects']),
                true,
            )))
            ->when($category !== '', fn (Collection $c) => $c->filter(fn ($r) => in_array(
                (string) $category,
                array_map(fn ($cat) => (string) $cat['id'], $r['categories']),
                true,
            )))
            ->when($search !== '', fn (Collection $c) => $c->filter(fn ($r) => str_contains(mb_strtolower(
                $r['name'] . ' ' . $r['email'] . ' ' . $r['city'] . ' ' . implode(' ', $r['subjects'])
            ), mb_strtolower($search))))
            ->values();

        $page = max(1, (int) $request->integer('page', 1));

        // Hand-built, like AdminTeacherController::index: the row is assembled
        // in PHP from four sources, so the database cannot paginate it as one
        // query. Staff-scale volume — tens of teachers, not thousands.
        $paginator = new LengthAwarePaginator(
            $rows->forPage($page, self::PER_PAGE)->values(),
            $rows->count(),
            self::PER_PAGE,
            $page,
            ['path' => $request->url(), 'query' => $request->query()],
        );

        return response()->json([
            'data' => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
                'total'        => $paginator->total(),
                'per_page'     => self::PER_PAGE,
            ],
        ]);
    }

    /**
     * The chip rows.
     *
     * Counts are teachers-under-this-chip, computed from the same roster the
     * table is built from, so a chip reading "Piano 4" cannot select 3 rows.
     *
     * That holds only if the tally uses index()'s equality rule, and tutors.subjects
     * is free text a human typed. Keyed on the raw string it did not: one teacher
     * writing "piano" split the chip in two and both halves selected the same
     * five rows, and "Piano, Piano" in one CSV counted that teacher twice. So the
     * key is the lowercased subject — the form index() compares — the first
     * spelling seen is kept as the label, and each teacher is counted at most
     * once per subject.
     */
    public function filters()
    {
        $rows = $this->roster();

        $subjects = [];
        $categories = [];
        foreach ($rows as $row) {
            $counted = [];
            foreach ($row['subjects'] as $subject) {
                $key = mb_strtolower(trim((string) $subject));
                if ($key === '' || isset($counted[$key])) {
                    continue;
                }
                $counted[$key] = true;
                $subjects[$key] ??= ['key' => $key, 'label' => (string) $subject, 'count' => 0];
                $subjects[$key]['count']++;
            }
            foreach ($row['categories'] as $cat) {
                $key = (string) $cat['id'];
                $categories[$key] ??= ['key' => $key, 'label' => $cat['name'], 'count' => 0];
                $categories[$key]['count']++;
            }
        }

        $subjectChips = array_values($subjects);

        $sort = fn (array $a, array $b) => [$b['count'], $a['label']] <=> [$a['count'], $b['label']];
        usort($subjectChips, $sort);
        $categoryChips = array_values($categories);
        usort($categoryChips, $sort);

        return response()->json(['subjects' => $subjectChips, 'categories' => $categoryChips]);
    }

    public function show(Tutor $tutor)
    {
        $teacher = $this->roster([$tutor->id])->first();
        abort_unless($teacher, 404, 'Teacher not found.');

        $enrolledIds = $this->enrolmentCourseIds([$tutor->id])[$tutor->id] ?? [];
        $grants      = TeacherCourseGrant::where('tutor_id', $tutor->id)->get()->keyBy('course_id');
        $linkedIds   = array_values(array_unique(array_merge($enrolledIds, $grants->keys()->map(fn ($k) => (int) $k)->all())));

        // Unpublished material is listed here and nowhere else — staff stage a
        // deck before releasing it, and materials_count on the row deliberately
        // counts only what a teacher can actually open.
        $materials = CourseMaterial::query()
            ->whereIn('course_id', $linkedIds ?: [0])
            ->orderBy('course_id')->orderBy('position')->orderBy('id')
            ->get()->groupBy('course_id');

        // How many of this teacher's own students sit on each course. A granted
        // course with nobody on it reports 0, which is the point of the grant.
        $students = Enrollment::query()
            ->where('tutor_id', $tutor->id)->where('status', 'active')
            ->whereIn('course_id', $linkedIds ?: [0])
            ->get(['course_id', 'student_id'])
            ->groupBy('course_id')
            ->map(fn ($g) => $g->pluck('student_id')->unique()->count());

        $courses = Course::whereIn('id', $linkedIds ?: [0])->orderBy('name')->get(['id', 'name', 'slug'])
            ->map(function (Course $c) use ($enrolledIds, $grants, $materials, $students) {
                $isEnrolled = in_array((int) $c->id, $enrolledIds, true);
                $grant      = $grants[$c->id] ?? null;

                return [
                    'id'        => (int) $c->id,
                    'name'      => $c->name,
                    'slug'      => $c->slug,
                    'source'    => $isEnrolled && $grant ? 'both' : ($grant ? 'grant' : 'enrolment'),
                    'grant_id'  => $grant?->id,
                    'students'  => (int) ($students[$c->id] ?? 0),
                    'materials' => ($materials[$c->id] ?? collect())->map(fn (CourseMaterial $m) => [
                        'id'           => $m->id,
                        'title'        => $m->title,
                        'type'         => $m->type,
                        'is_published' => (bool) $m->is_published,
                        'has_file'     => (bool) $m->path,
                        'link_url'     => $m->link_url,
                        'size_kb'      => $m->sizeKb(),
                        'uploaded_at'  => optional($m->created_at)->toDateString(),
                    ])->values()->all(),
                ];
            })->values()->all();

        $suggested = collect(SubjectCourseMap::coursesForSubjects($tutor->subjects_list)['courses'])
            ->reject(fn ($c) => in_array($c['id'], $linkedIds, true))
            ->map(fn ($c) => [
                'id'         => $c['id'],
                'name'       => $c['name'],
                'matched_on' => $c['matched_on'],
                'exact'      => $c['exact'],
            ])->values()->all();

        // Classes that have happened. A teacher may enter a 'scheduled' log for a
        // future date, and unbounded this panel listed it as their most recent
        // class while the panel above listed the same class as upcoming — one
        // class twice on one screen, and it evicted a genuinely taught class from
        // the last ten. 'missed' stays: a teacher missing classes is exactly what
        // an admin handing out material wants to see.
        $recent = ClassLog::query()
            ->where('tutor_id', $tutor->id)
            ->whereIn('status', ['completed', 'missed'])
            ->whereDate('held_on', '<=', now()->toDateString())
            ->with(['enrollment.student:id,name', 'enrollment.course:id,name'])
            ->orderByDesc('held_on')->orderByDesc('id')
            ->limit(10)->get()
            ->map(fn (ClassLog $l) => [
                'date'    => optional($l->held_on)->toDateString(),
                'topic'   => $l->topic,
                'status'  => $l->status,
                'student' => $l->enrollment?->student?->name,
                'course'  => $l->enrollment?->course?->name,
            ])->all();

        return response()->json(['data' => [
            'teacher'   => $teacher,
            'courses'   => $courses,
            'suggested' => $suggested,
            'upcoming'  => $this->upcomingByTutor([$tutor->id])[$tutor->id] ?? [],
            'recent'    => $recent,
        ]]);
    }

    /**
     * Hand a teacher a course.
     *
     * Re-granting is not an error — two staff members clicking the same button
     * mean the same thing — so the existing grant is returned rather than a
     * failure. The unique index is still the authority; the catch covers the
     * genuine race the check above cannot.
     */
    public function storeCourse(Request $request, Tutor $tutor)
    {
        $data = $request->validate([
            'course_id' => 'required|integer|exists:courses,id',
            'note'      => 'nullable|string|max:300',
        ]);

        $existing = TeacherCourseGrant::where('tutor_id', $tutor->id)
            ->where('course_id', $data['course_id'])->first();
        if ($existing) {
            return response()->json([
                'message' => "{$tutor->name} already has this course.",
                'data'    => $this->grantRow($existing),
            ]);
        }

        try {
            $grant = TeacherCourseGrant::create([
                'tutor_id'   => $tutor->id,
                'course_id'  => $data['course_id'],
                'granted_by' => $request->user()?->id,
                'note'       => $data['note'] ?? null,
            ]);
        } catch (QueryException $e) {
            $grant = TeacherCourseGrant::where('tutor_id', $tutor->id)
                ->where('course_id', $data['course_id'])->first();
            if (! $grant) {
                throw $e;
            }

            return response()->json([
                'message' => "{$tutor->name} already has this course.",
                'data'    => $this->grantRow($grant),
            ]);
        }

        AuditLog::record('teacher_course_granted', 'tutor', $tutor->id, $tutor->name, [
            'course' => Course::find($data['course_id'])?->name,
        ]);

        return response()->json([
            'message' => 'Course material shared with ' . $tutor->name . '.',
            'data'    => $this->grantRow($grant),
        ], 201);
    }

    /**
     * Withdraw a grant.
     *
     * This only removes the staff act. A teacher who also has an active
     * enrolment on the course keeps their derived access, which is correct —
     * they are still teaching it.
     */
    public function destroyGrant(TeacherCourseGrant $grant)
    {
        $tutor  = $grant->tutor;
        $course = $grant->course;
        $grant->delete();

        AuditLog::record('teacher_course_grant_removed', 'tutor', $tutor?->id, $tutor?->name, [
            'course' => $course?->name,
        ]);

        return response()->json(['message' => 'Course withdrawn from ' . ($tutor?->name ?? 'this teacher') . '.']);
    }

    // ---- Roster --------------------------------------------------------------

    /**
     * Every teacher, with the four aggregates the table shows.
     *
     * Unlisted teachers are included and carry is_listed, because a teacher
     * hidden from the public directory is exactly the one who may be waiting on
     * material. Dropping them would make the console lie by omission.
     *
     * Each aggregate is one grouped query over the whole roster. Counting
     * inside the loop instead would be five queries per teacher on a screen
     * whose whole purpose is to compare teachers side by side.
     *
     * @param  array<int,int>|null  $only  restrict to these tutor ids
     */
    private function roster(?array $only = null): Collection
    {
        $tutors = Tutor::query()
            ->with('user:id,name,email')
            ->when($only !== null, fn ($q) => $q->whereIn('id', $only))
            ->orderBy('name')->get();

        $tutorIds = $tutors->pluck('id')->map(fn ($id) => (int) $id)->all();
        if (! $tutorIds) {
            return collect();
        }

        $enrolled = $this->enrolmentCourseIds($tutorIds);

        $granted = TeacherCourseGrant::query()->whereIn('tutor_id', $tutorIds)
            ->get(['tutor_id', 'course_id'])
            ->groupBy('tutor_id')
            ->map(fn ($g) => $g->pluck('course_id')->map(fn ($v) => (int) $v)->unique()->values()->all());

        // Completed only. A 'scheduled' row is an intention, and counting it
        // would report classes that have not happened as classes taken.
        $taught = ClassLog::query()
            ->whereIn('tutor_id', $tutorIds)->where('status', 'completed')
            ->selectRaw('tutor_id, COUNT(*) as taken, MAX(held_on) as last_on')
            ->groupBy('tutor_id')->get()->keyBy('tutor_id');

        $materialCounts = CourseMaterial::query()->published()
            ->selectRaw('course_id, COUNT(*) as total')
            ->groupBy('course_id')->pluck('total', 'course_id');

        $upcoming = $this->upcomingByTutor($tutorIds);
        $rootNames = SubjectCourseMap::rootCategoryNames();

        return $tutors->map(function (Tutor $t) use ($enrolled, $granted, $taught, $materialCounts, $upcoming, $rootNames) {
            $subjects = $t->subjects_list;
            $matched  = SubjectCourseMap::coursesForSubjects($subjects);

            $linked = array_values(array_unique(array_merge(
                $enrolled[$t->id] ?? [],
                $granted[$t->id] ?? [],
            )));

            // Categories come from what they teach AND what their subjects
            // point at, so a teacher with no enrolments still lands under a
            // chip instead of falling out of every filter.
            $rootIds = SubjectCourseMap::rootCategoryIdsForCourses(
                array_values(array_unique(array_merge($linked, array_column($matched['courses'], 'id'))))
            );
            $categories = collect($rootIds)
                ->filter(fn ($id) => isset($rootNames[$id]))
                ->map(fn ($id) => ['id' => (int) $id, 'name' => $rootNames[$id]])
                ->sortBy('name')->values()->all();

            $log = $taught[$t->id] ?? null;

            return [
                'id'                 => (int) $t->id,
                'name'               => $t->name,
                'email'              => $t->user?->email,
                'city'               => $t->city,
                'subjects'           => $subjects,
                'categories'         => $categories,
                'is_listed'          => (bool) $t->is_published,
                'upcoming_count'     => count($upcoming[$t->id] ?? []),
                'classes_taken'      => (int) ($log->taken ?? 0),
                'last_class_on'      => $log?->last_on ? Carbon::parse($log->last_on)->toDateString() : null,
                'courses_count'      => count($linked),
                'materials_count'    => array_sum(array_map(
                    fn ($courseId) => (int) ($materialCounts[$courseId] ?? 0),
                    $linked,
                )),
                // Two different statements, kept apart. unmatched_subjects is a
                // subject the catalogue carries nowhere, so "nothing can be
                // handed out for it" is true. ambiguous_subjects is a subject the
                // catalogue does carry but no single course is headed by — the
                // matcher declining, not a gap — and it arrives with the courses
                // that do mention it so staff can pick one instead of being told
                // to create a course that already exists.
                'unmatched_subjects' => $matched['unmatched'],
                'ambiguous_subjects' => $matched['ambiguous'],
            ];
        })->values();
    }

    /**
     * Course ids a tutor is entitled to by enrolment.
     *
     * Deliberately the same test as CourseMaterial::courseIdsFor — active, and
     * course_id not null. If this drifted, the console would tell staff a
     * teacher can open a file the teacher's own dashboard refuses to show.
     *
     * @param  array<int,int>  $tutorIds
     * @return array<int,array<int,int>>
     */
    private function enrolmentCourseIds(array $tutorIds): array
    {
        return Enrollment::query()
            ->whereIn('tutor_id', $tutorIds)
            ->where('status', 'active')->whereNotNull('course_id')
            ->get(['tutor_id', 'course_id'])
            ->groupBy('tutor_id')
            ->map(fn ($g) => $g->pluck('course_id')->map(fn ($v) => (int) $v)->unique()->values()->all())
            ->all();
    }

    /**
     * Dated class occurrences per tutor for the next fortnight.
     *
     * This is EnrollmentController::upcomingClasses' projection, pointed at
     * teachers instead of a family: an explicitly dated class_log wins for its
     * date, the weekly enrollment_schedules rule fills the rest, a reported
     * absence is labelled rather than shown as normal, and a cancelled day is
     * dropped. There is one projection in this codebase on purpose — a second
     * one would eventually tell a parent and an admin different things about
     * the same Thursday.
     *
     * One deviation, and it is the reason for the horizon: the family card
     * takes any future dated log and then slices to ten, while upcoming_count
     * here is published as a 14-day figure. A class booked three months out
     * must not inflate it.
     *
     * The other difference is that this one buckets BY TEACHER, which the family
     * card never has to do. That is where a covered class matters: the teacher
     * who will be in the room is the substitute, and they are exactly the teacher
     * who needs the material for it.
     *
     * @param  array<int,int>  $tutorIds
     * @return array<int,array<int,array<string,mixed>>>
     */
    private function upcomingByTutor(array $tutorIds): array
    {
        $today   = now()->startOfDay();
        $horizon = $today->copy()->addDays(self::HORIZON_DAYS);
        $wanted  = array_flip($tutorIds);

        // A teacher covering someone else's Thursday has no enrolment of their
        // own to be found through, so the cover rows are read first and their
        // enrolments pulled in alongside. Without this, asking for the substitute
        // alone loads nothing to reattribute and they report zero.
        $coverEnrollmentIds = ClassAbsence::query()
            ->where('status', 'covered')
            ->whereIn('substitute_tutor_id', $tutorIds)
            ->whereDate('occurs_on', '>=', $today->toDateString())
            ->whereDate('occurs_on', '<=', $horizon->toDateString())
            ->pluck('enrollment_id')->unique()->all();

        $enrollments = Enrollment::query()
            ->where(function ($q) use ($tutorIds, $coverEnrollmentIds) {
                $q->whereIn('tutor_id', $tutorIds);
                if ($coverEnrollmentIds) {
                    $q->orWhereIn('id', $coverEnrollmentIds);
                }
            })
            ->with(['student:id,name', 'course:id,name', 'tutor:id,name'])->get()->keyBy('id');
        if ($enrollments->isEmpty()) {
            return [];
        }
        $enrollmentIds = $enrollments->keys()->all();

        $out   = [];
        $seen  = [];
        $slots = [];

        $logs = ClassLog::query()
            ->whereIn('enrollment_id', $enrollmentIds)
            ->where('status', 'scheduled')
            ->whereDate('held_on', '>=', $today->toDateString())
            ->whereDate('held_on', '<=', $horizon->toDateString())
            ->orderBy('held_on')->get();

        foreach ($logs as $log) {
            $enrollment = $enrollments[$log->enrollment_id] ?? null;
            // The log's own tutor, because a substitute's dated class belongs
            // in the substitute's list, not the usual teacher's.
            $tutorId = (int) ($log->tutor_id ?? $enrollment?->tutor_id);
            if (! $tutorId) {
                continue;
            }

            // A dated log wins for its whole date, even where the timetable has
            // two slots that day: class_logs carries no time, so there is no way
            // to tell which of the two the teacher meant, and showing both would
            // risk counting one class twice.
            $seen[$log->enrollment_id . '|' . $log->held_on->toDateString()] = true;
            if (! isset($wanted[$tutorId])) {
                continue;
            }
            $out[$tutorId][] = [
                'date'    => $log->held_on->toDateString(),
                'time'    => null,                 // class_logs carries a date, never a time
                'student' => $enrollment?->student?->name,
                'course'  => $enrollment?->course?->name,
                'note'    => null,
            ];
        }

        $schedules = EnrollmentSchedule::query()
            ->whereIn('enrollment_id', $enrollmentIds)->active()->get();

        $absences = ClassAbsence::query()
            ->whereIn('enrollment_id', $enrollmentIds)
            ->whereDate('occurs_on', '>=', $today->toDateString())
            ->whereDate('occurs_on', '<=', $horizon->toDateString())
            ->with('substitute:id,name')
            ->get()
            ->keyBy(fn (ClassAbsence $a) => $a->enrollment_id . '|' . Carbon::parse($a->occurs_on)->toDateString());

        foreach ($schedules as $sch) {
            $enrollment = $enrollments[$sch->enrollment_id] ?? null;
            $tutorId    = (int) ($enrollment?->tutor_id ?? 0);
            if (! $tutorId) {
                continue;
            }

            for ($day = $today->copy(); $day->lte($horizon); $day->addDay()) {
                if ($day->dayOfWeekIso !== $sch->weekday) {
                    continue;
                }

                $key = $sch->enrollment_id . '|' . $day->toDateString();
                if (isset($seen[$key])) {
                    continue;                      // the teacher already dated this one
                }

                // Two keys, because they answer different questions. $seen is
                // "did a dated log already claim this date". $slots is
                // slot-against-slot: enrollment_schedules is unique on
                // (enrollment, weekday, start_time), so one enrolment may hold a
                // Monday 17:00 and a Monday 19:00, and a date-only key silently
                // dropped the second from both the list and the count.
                $slot = $key . '|' . $sch->start_time;
                if (isset($slots[$slot])) {
                    continue;
                }
                $slots[$slot] = true;

                $absence = $absences[$key] ?? null;
                if ($absence?->status === 'cancelled') {
                    continue;
                }

                // A covered class belongs to the substitute — they are teaching
                // it, and they are the teacher who needs the material for it. The
                // class_logs branch above already says so; this branch used to
                // credit the absent teacher instead, so the console showed the
                // substitute a bold 0 and an empty panel. 'online' stays with the
                // usual teacher, who does still teach it.
                $covering = $absence?->status === 'covered' && $absence->substitute_tutor_id
                    ? (int) $absence->substitute_tutor_id
                    : null;
                $occurrenceTutor = $covering ?? $tutorId;
                if (! isset($wanted[$occurrenceTutor])) {
                    continue;
                }

                $note = match ($absence?->status) {
                    'covered'   => $covering
                        ? 'Covering for ' . ($enrollment?->tutor?->name ?? 'the assigned teacher')
                        : 'A substitute is covering this class',
                    'online'    => 'Moved online for this day',
                    'requested', 'uncovered' => 'Cover is being arranged — the assigned teacher cannot make this day',
                    default     => null,
                };

                $out[$occurrenceTutor][] = [
                    'date'    => $day->toDateString(),
                    'time'    => Carbon::createFromFormat('H:i:s', $sch->start_time)->format('H:i'),
                    'student' => $enrollment?->student?->name,
                    'course'  => $enrollment?->course?->name,
                    'note'    => $note,
                ];
            }
        }

        foreach ($out as $tutorId => $rows) {
            usort($rows, fn ($a, $b) => [$a['date'], $a['time'] ?? ''] <=> [$b['date'], $b['time'] ?? '']);
            $out[$tutorId] = $rows;
        }

        return $out;
    }

    private function grantRow(TeacherCourseGrant $grant): array
    {
        $grant->loadMissing('course:id,name,slug');

        return [
            'id'         => $grant->id,
            'tutor_id'   => (int) $grant->tutor_id,
            'course_id'  => (int) $grant->course_id,
            'course'     => $grant->course?->only(['id', 'name', 'slug']),
            'note'       => $grant->note,
            'granted_at' => optional($grant->created_at)->toDateString(),
        ];
    }
}
