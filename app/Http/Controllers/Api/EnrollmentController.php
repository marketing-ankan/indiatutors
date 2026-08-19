<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Http\Resources\ClassLogResource;
use App\Http\Resources\ClassMaterialResource;
use App\Http\Resources\CurriculumItemResource;
use App\Http\Resources\EnrollmentResource;
use App\Models\AppNotification;
use App\Models\ClassMaterial;
use App\Models\Enrollment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class EnrollmentController extends Controller {
    /** A signed-in learner's enrollments — a guardian's children, or a student's own. */
    public function myIndex(Request $request) {
        return EnrollmentResource::collection(
            $this->enrollmentsFor($request->user())
                ->with(['student:id,name', 'tutor:id,name,slug', 'course:id,name,slug', 'schedules'])
                ->latest()->get()
        );
    }

    /** Parent portal: one enrollment in full — teacher, curriculum, progress, materials. */
    public function myShow(Request $request, Enrollment $enrollment) {
        $this->authorizeParent($request, $enrollment);
        $enrollment->load(['student:id,name', 'course:id,name,slug', 'tutor']);

        return response()->json(['data' => [
            'id'         => $enrollment->id,
            'status'     => $enrollment->status,
            'plan'       => $enrollment->plan,
            'student'    => $enrollment->student?->name,
            'course'     => $enrollment->course?->only(['name', 'slug']),
            'teacher'    => $enrollment->tutor ? [
                'name'             => $enrollment->tutor->name,
                'slug'             => $enrollment->tutor->slug,
                'qualification'    => $enrollment->tutor->qualification,
                'subjects'         => $enrollment->tutor->subjects_list,
                'experience_years' => $enrollment->tutor->experience_years,
                'city'             => $enrollment->tutor->city,
                'teaching_mode'    => $enrollment->tutor->teaching_mode,
                'image_url'        => $enrollment->tutor->image_url,
            ] : null,
            'curriculum' => CurriculumItemResource::collection($enrollment->curriculumItems()->get()),
            'classes'    => ClassLogResource::collection($enrollment->classLogs()->get()),
            'materials'  => ClassMaterialResource::collection($enrollment->materials()->get()),
            'reschedules'=> $enrollment->reschedules()->get()->map(fn ($r) => [
                'id'             => $r->id,
                'preferred_date' => optional($r->preferred_date)->toDateString(),
                'reason'         => $r->reason,
                'status'         => $r->status,
                'created_at'     => optional($r->created_at)->toDateString(),
            ]),
        ]]);
    }

    /** Upcoming scheduled classes across all the parent's enrollments (Phase 6). */
    /**
     * What is actually coming up for this family.
     *
     * This used to read only class_logs with status 'scheduled' — individual
     * dated rows a teacher had entered in advance. Nothing in the product ever
     * creates those: teachers log a class after teaching it, as 'completed'. So
     * the card was empty for every family on the site, while the card directly
     * above it listed "Mondays at 5:00 PM, Tuesdays at 5:00 PM…" from the
     * standing timetable. One screen, telling a parent both that their child
     * has five classes a week and that nothing is scheduled.
     *
     * The timetable is the answer. enrollment_schedules holds the weekly rule;
     * this projects it forward into dated occurrences, which is exactly what a
     * family means by "upcoming". An explicitly scheduled class_log still wins
     * for its date — a teacher naming a specific day is more authoritative than
     * the recurring rule — and a day someone has reported an absence on is
     * labelled rather than silently shown as normal, because "your teacher
     * cannot make Thursday" is the single most useful thing this card can say.
     */
    public function upcomingClasses(Request $request) {
        $enrollmentIds = $this->enrollmentsFor($request->user())->pluck('enrollments.id');
        if ($enrollmentIds->isEmpty()) return response()->json(['data' => []]);

        $today  = now()->startOfDay();
        $horizon = $today->copy()->addDays(14);

        // Explicitly dated classes a teacher entered ahead of time.
        $logs = \App\Models\ClassLog::whereIn('enrollment_id', $enrollmentIds)
            ->where('status', 'scheduled')
            ->whereDate('held_on', '>=', $today->toDateString())
            ->with(['enrollment.student:id,name', 'enrollment.course:id,name', 'tutor:id,name'])
            ->orderBy('held_on')->get();

        $out  = [];
        $seen = [];
        foreach ($logs as $l) {
            $key = $l->enrollment_id . '|' . $l->held_on->toDateString();
            $seen[$key] = true;
            $out[] = [
                'date'    => $l->held_on->toDateString(),
                'time'    => null,
                'topic'   => $l->topic,
                'student' => $l->enrollment?->student?->name,
                'course'  => $l->enrollment?->course?->name,
                'plan'    => $l->enrollment?->plan,
                'teacher' => $l->tutor?->name,
                'note'    => null,
            ];
        }

        // The weekly timetable, projected across the next fortnight.
        $schedules = \App\Models\EnrollmentSchedule::whereIn('enrollment_id', $enrollmentIds)
            ->active()
            ->with(['enrollment.student:id,name', 'enrollment.course:id,name', 'enrollment.tutor:id,name'])
            ->get();

        // Reported absences, so a class that is not happening as usual says so.
        $absences = \App\Models\ClassAbsence::whereIn('enrollment_id', $enrollmentIds)
            ->whereDate('occurs_on', '>=', $today->toDateString())
            ->whereDate('occurs_on', '<=', $horizon->toDateString())
            ->with('substitute:id,name')
            ->get()
            ->keyBy(fn ($a) => $a->enrollment_id . '|' . \Illuminate\Support\Carbon::parse($a->occurs_on)->toDateString());

        foreach ($schedules as $sch) {
            for ($day = $today->copy(); $day->lte($horizon); $day->addDay()) {
                if ($day->dayOfWeekIso !== $sch->weekday) continue;

                $key = $sch->enrollment_id . '|' . $day->toDateString();
                if (isset($seen[$key])) continue;   // the teacher already dated this one
                $seen[$key] = true;

                $absence = $absences[$key] ?? null;
                $note = match ($absence?->status) {
                    'covered'   => trim(($absence->substitute?->name ?? 'A substitute') . ' is covering this class'),
                    'online'    => 'Moved online for this day',
                    'cancelled' => 'Cancelled',
                    'requested', 'uncovered' => 'Your teacher cannot make this day — we are arranging cover',
                    default     => null,
                };
                if ($absence?->status === 'cancelled') continue;

                $out[] = [
                    'date'    => $day->toDateString(),
                    'time'    => \Illuminate\Support\Carbon::createFromFormat('H:i:s', $sch->start_time)->format('g:i A'),
                    'topic'   => null,
                    'student' => $sch->enrollment?->student?->name,
                    'course'  => $sch->enrollment?->course?->name,
                    // Falls back to the plan ("One-to-One") so a row is not ten
                    // identical lines reading "Class" when an enrolment has no
                    // catalogue course attached, which is the common case for
                    // bespoke tuition.
                    'plan'    => $sch->enrollment?->plan,
                    'teacher' => $sch->enrollment?->tutor?->name,
                    'note'    => $note,
                ];
            }
        }

        usort($out, fn ($a, $b) => [$a['date'], $a['time'] ?? ''] <=> [$b['date'], $b['time'] ?? '']);

        return response()->json(['data' => array_slice($out, 0, 10)]);
    }

    /** Parent asks the teacher to reschedule an upcoming class (Phase 8). */
    public function requestReschedule(Request $request, Enrollment $enrollment) {
        $this->authorizeParent($request, $enrollment);
        $data = $request->validate([
            'preferred_date' => 'nullable|date|after_or_equal:today',
            'reason'         => 'nullable|string|max:500',
        ]);
        $r = $enrollment->reschedules()->create($data + ['requested_by' => $request->user()->id, 'status' => 'pending']);

        // Tell the assigned teacher.
        AppNotification::send(
            $enrollment->tutor?->user_id,
            'reschedule_requested',
            'Reschedule requested',
            trim(($enrollment->student?->name ?? 'A student') . "'s parent asked to reschedule"
                . ($r->preferred_date ? ' to ' . $r->preferred_date->toDateString() : '')
                . ($r->reason ? " — {$r->reason}" : '')),
        );

        return response()->json(['data' => ['id' => $r->id, 'status' => $r->status]], 201);
    }

    /** Download a shared material — allowed for the owning parent or the assigned teacher. */
    public function downloadMaterial(Request $request, ClassMaterial $material) {
        $enrollment = $material->enrollment;
        $user = $request->user();
        $isLearner = $this->ownsStudent($enrollment->student, $user);
        $isTeacher = $user->isTeacher() && $user->tutor && $enrollment->tutor_id === $user->tutor->id;
        abort_unless($isLearner || $isTeacher || $user->isAdmin(), 403, 'Not your material.');
        abort_unless($material->path && Storage::disk('local')->exists($material->path), 404, 'No file attached.');

        return Storage::disk('local')->download($material->path, $material->original_name ?? 'material');
    }

    private function authorizeParent(Request $request, Enrollment $enrollment): void {
        abort_unless(
            $this->ownsStudent($enrollment->student, $request->user()),
            403, 'This enrollment does not belong to your account.'
        );
    }

    /**
     * A student profile is reachable by the guardian who owns it and by the
     * student's own account, when one has been linked. The explicit null check
     * keeps an unlinked profile (account_user_id = null) from ever matching.
     */
    private function ownsStudent($student, $user): bool {
        if (!$student) return false;
        if ($student->user_id === $user->id) return true;

        return $student->account_user_id !== null && $student->account_user_id === $user->id;
    }

    /** Enrollments visible to a learner: a guardian's children's, or a student's own. */
    private function enrollmentsFor($user) {
        return $user->isStudent() && $user->studentProfile
            ? Enrollment::where('student_id', $user->studentProfile->id)
            : $user->enrollments();
    }
}
