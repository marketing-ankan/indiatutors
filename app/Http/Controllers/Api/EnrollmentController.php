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
                ->with(['student:id,name', 'tutor:id,name,slug', 'course:id,name,slug'])
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
    public function upcomingClasses(Request $request) {
        $enrollmentIds = $this->enrollmentsFor($request->user())->pluck('enrollments.id');
        $classes = \App\Models\ClassLog::whereIn('enrollment_id', $enrollmentIds)
            ->where('status', 'scheduled')
            ->whereDate('held_on', '>=', now()->toDateString())
            ->with(['enrollment.student:id,name', 'enrollment.course:id,name', 'tutor:id,name'])
            ->orderBy('held_on')->limit(10)->get();

        return response()->json(['data' => $classes->map(fn ($l) => [
            'id'      => $l->id,
            'date'    => $l->held_on->toDateString(),
            'topic'   => $l->topic,
            'student' => $l->enrollment?->student?->name,
            'course'  => $l->enrollment?->course?->name,
            'teacher' => $l->tutor?->name,
        ])]);
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
