<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Http\Resources\ClassLogResource;
use App\Http\Resources\ClassMaterialResource;
use App\Http\Resources\CourseProposalResource;
use App\Http\Resources\CurriculumItemResource;
use App\Http\Resources\TeacherDemoResource;
use App\Http\Resources\TeacherEnrollmentResource;
use App\Http\Resources\TeacherProfileResource;
use App\Models\AppNotification;
use App\Models\ClassLog;
use App\Models\ClassMaterial;
use App\Models\CurriculumItem;
use App\Models\DemoRequest;
use App\Models\DemoSlotProposal;
use App\Models\Enrollment;
use App\Models\RescheduleRequest;
use App\Support\TeacherProfilePublisher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class TeacherController extends Controller {
    public function showMine(Request $request) {
        abort_unless($request->user()->isTeacher(), 403, 'Teacher accounts only.');
        $profile = $request->user()->teacherProfile()->firstOrCreate([], ['status' => 'pending']);
        return new TeacherProfileResource($profile);
    }

    public function updateMine(Request $request) {
        abort_unless($request->user()->isTeacher(), 403, 'Teacher accounts only.');
        $data = $request->validate([
            'headline'          => 'nullable|string|max:255',
            'qualification'     => 'nullable|string|max:255',
            'subjects'          => 'nullable|string|max:255',
            'languages'         => 'nullable|string|max:255',
            'experience_years'  => 'nullable|integer|min:0|max:70',
            'fee_hourly'        => 'nullable|numeric|min:0|max:100000',
            'city'              => 'nullable|string|max:80',
            'teaching_mode'     => 'nullable|in:online,home,both',
            'service_areas'     => 'nullable|string|max:255',
            'availability'      => 'nullable|array',
            'availability.days' => 'nullable|array',
            'availability.slots'=> 'nullable|string|max:255',
            'bio'               => 'nullable|string|max:2000',
        ]);
        $profile = $request->user()->teacherProfile()->firstOrCreate([], ['status' => 'pending']);
        $profile->update($data);
        $profile->refresh();

        // An approved teacher's edits do NOT go live on their own. They mark the
        // profile for review and an admin publishes them — the same instinct
        // that keeps a family's phone number behind a coordinator.
        //
        // Only stamped when the edit would actually change the public listing:
        // saving the form with nothing altered must not create review work, or
        // staff learn to clear the queue without reading it. A profile that is
        // not yet approved needs no flag — approval publishes it anyway.
        if ($profile->status === 'approved') {
            $diff = TeacherProfilePublisher::diff($profile, $request->user()->tutor()->first());
            if ($diff && ! $profile->hasUnpublishedChanges()) {
                $profile->forceFill(['changes_submitted_at' => now()])->save();
            } elseif (! $diff && $profile->hasUnpublishedChanges()) {
                // Edited back to what is already published — nothing to review.
                $profile->forceFill(['changes_submitted_at' => null])->save();
            }
        }

        return new TeacherProfileResource($profile->fresh());
    }

    /** The teacher's student roster — enrollments assigned to their directory tutor. */
    public function students(Request $request) {
        $tutor = $this->tutorFor($request);
        if (!$tutor) return TeacherEnrollmentResource::collection([]);

        return TeacherEnrollmentResource::collection(
            $tutor->enrollments()
                ->with(['student:id,name', 'course:id,name', 'classLogs:id,enrollment_id,held_on'])
                ->withCount('classLogs')
                ->latest()->get()
        );
    }

    /** Demo classes assigned to this teacher that haven't converted yet. */
    public function demos(Request $request) {
        $tutor = $this->tutorFor($request);
        if (!$tutor) return TeacherDemoResource::collection([]);

        // Expressed as "not finished" rather than a whitelist of live states:
        // the old whereIn(['new','scheduled']) meant every state added to the
        // lifecycle silently vanished from the teacher's portal — they would
        // simply never see a booking sitting in 'contacted'.
        return TeacherDemoResource::collection(
            $tutor->assignedDemos()
                ->with(['student:id,name', 'course:id,name,slug', 'slots'])
                ->whereNotIn('status', ['converted', 'no_show', 'closed'])
                ->latest()->get()
        );
    }

    /**
     * Propose a time for a demo you have been assigned.
     *
     * This is the in-app half of the owner's "in-app by default, phone as
     * fallback" decision: the teacher offers slots, the family accepts one from
     * their dashboard, and no phone number has to change hands for that to
     * happen. A coordinator can still settle it on a call and log the result.
     */
    public function proposeDemoSlot(Request $request, DemoRequest $demoRequest) {
        $tutor = $this->tutorFor($request);
        // Assignment is the authorisation. A teacher must not be able to
        // schedule against a booking that is not theirs, and the id is
        // guessable, so this check is the whole gate.
        abort_if(! $tutor || $demoRequest->assigned_tutor_id !== $tutor->id, 403,
            'This demo is not assigned to you.');
        abort_if(in_array($demoRequest->status, ['converted', 'no_show', 'closed'], true), 422,
            'This demo is already closed.');

        $data = $request->validate([
            'starts_at'        => 'required|date|after:now',
            'duration_minutes' => 'nullable|integer|min:15|max:240',
            'note'             => 'nullable|string|max:300',
        ]);

        // A wall of open offers is not a choice, it is noise for the family and
        // a scheduling hazard for the teacher.
        abort_if($demoRequest->slots()->open()->count() >= 5, 422,
            'You already have five open proposals on this demo — withdraw one first.');

        $slot = $demoRequest->slots()->create([
            'proposed_by'      => $request->user()->id,
            'source'           => 'teacher',
            'starts_at'        => $data['starts_at'],
            'duration_minutes' => $data['duration_minutes'] ?? 45,
            'note'             => $data['note'] ?? null,
            'status'           => 'proposed',
        ]);

        // Move a brand-new booking along: someone has now actually engaged with
        // it, which is exactly what 'contacted' records.
        if ($demoRequest->status === 'new') {
            $demoRequest->update(['status' => 'contacted']);
        }

        AppNotification::send(
            $demoRequest->user_id,
            'demo_slot_proposed',
            'A demo time has been proposed',
            trim(($demoRequest->subject ?: 'Your demo') . ' — ' . $slot->starts_at->toDayDateTimeString()
                . '. Open your dashboard to accept or ask for another time.'),
        );

        return response()->json(['message' => 'Time proposed. The family will be asked to confirm.'], 201);
    }

    /** Withdraw a slot you proposed and no longer want to hold. */
    public function withdrawDemoSlot(Request $request, DemoRequest $demoRequest, DemoSlotProposal $slot) {
        $tutor = $this->tutorFor($request);
        abort_if(! $tutor || $demoRequest->assigned_tutor_id !== $tutor->id, 403, 'This demo is not assigned to you.');
        abort_if($slot->demo_request_id !== $demoRequest->id, 404, 'That slot is not on this demo.');
        abort_if($slot->status !== 'proposed', 422, 'Only an open proposal can be withdrawn.');

        $slot->update(['status' => 'withdrawn', 'responded_at' => now()]);
        return response()->json(['message' => 'Proposal withdrawn.']);
    }

    public function classLogs(Request $request, Enrollment $enrollment) {
        $this->authorizeEnrollment($request, $enrollment);
        return ClassLogResource::collection($enrollment->classLogs()->get());
    }

    public function storeClassLog(Request $request, Enrollment $enrollment) {
        $tutor = $this->authorizeEnrollment($request, $enrollment);
        $data = $request->validate([
            'topic'        => 'required|string|max:200',
            'held_on'      => 'required|date',
            'duration_min' => 'nullable|integer|min:0|max:600',
            'homework'     => 'nullable|string|max:2000',
            'notes'        => 'nullable|string|max:2000',
            'status'       => 'nullable|in:completed,scheduled,missed',
        ]);
        $log = $enrollment->classLogs()->create([
            ...$data,
            'tutor_id' => $tutor->id,
            'status'   => $data['status'] ?? 'completed',
        ]);
        return (new ClassLogResource($log))->response()->setStatusCode(201);
    }

    // --- Curriculum (define / divide / edit, per enrollment) ---

    public function curriculum(Request $request, Enrollment $enrollment) {
        $this->authorizeEnrollment($request, $enrollment);
        return CurriculumItemResource::collection($enrollment->curriculumItems()->get());
    }

    public function storeCurriculumItem(Request $request, Enrollment $enrollment) {
        $this->authorizeEnrollment($request, $enrollment);
        $data = $request->validate([
            'topic'   => 'required|string|max:200',
            'details' => 'nullable|string|max:2000',
        ]);
        $item = $enrollment->curriculumItems()->create([
            ...$data,
            'position' => ($enrollment->curriculumItems()->max('position') ?? 0) + 1,
        ]);
        return (new CurriculumItemResource($item))->response()->setStatusCode(201);
    }

    public function updateCurriculumItem(Request $request, Enrollment $enrollment, CurriculumItem $item) {
        $this->authorizeEnrollment($request, $enrollment);
        abort_unless($item->enrollment_id === $enrollment->id, 404);
        $data = $request->validate([
            'topic'    => 'sometimes|string|max:200',
            'details'  => 'nullable|string|max:2000',
            'status'   => 'sometimes|in:pending,in_progress,done',
            'position' => 'sometimes|integer|min:0|max:10000',
        ]);
        $item->update($data);
        return new CurriculumItemResource($item->fresh());
    }

    public function destroyCurriculumItem(Request $request, Enrollment $enrollment, CurriculumItem $item) {
        $this->authorizeEnrollment($request, $enrollment);
        abort_unless($item->enrollment_id === $enrollment->id, 404);
        $item->delete();
        return response()->json(['message' => 'Removed.']);
    }

    // --- Materials (notes / PPT / lesson plans / question bank) ---

    public function materials(Request $request, Enrollment $enrollment) {
        $this->authorizeEnrollment($request, $enrollment);
        return ClassMaterialResource::collection($enrollment->materials()->get());
    }

    public function storeMaterial(Request $request, Enrollment $enrollment) {
        $tutor = $this->authorizeEnrollment($request, $enrollment);
        $data = $request->validate([
            'type'     => 'required|in:note,ppt,lesson_plan,question_bank,homework,other',
            'title'    => 'required|string|max:160',
            'file'     => 'nullable|file|max:10240|mimes:jpg,jpeg,png,pdf,ppt,pptx,doc,docx,xls,xlsx,txt',
            'link_url' => 'nullable|url|max:500',
        ]);
        abort_if(!$request->hasFile('file') && empty($data['link_url']), 422, 'Attach a file or provide a link.');

        $path = $request->hasFile('file')
            ? $request->file('file')->store("materials/{$enrollment->id}", 'local') // private, like KYC
            : null;

        $material = $enrollment->materials()->create([
            'tutor_id'      => $tutor->id,
            'type'          => $data['type'],
            'title'         => $data['title'],
            'original_name' => $request->hasFile('file') ? $request->file('file')->getClientOriginalName() : null,
            'path'          => $path,
            'link_url'      => $data['link_url'] ?? null,
        ]);

        AppNotification::send(
            $enrollment->student?->user_id,
            'material_shared',
            'New material from your teacher',
            "\"{$material->title}\" was shared for " . ($enrollment->student?->name ?? 'your student') . '.',
        );

        return (new ClassMaterialResource($material))->response()->setStatusCode(201);
    }

    public function destroyMaterial(Request $request, Enrollment $enrollment, ClassMaterial $material) {
        $this->authorizeEnrollment($request, $enrollment);
        abort_unless($material->enrollment_id === $enrollment->id, 404);
        if ($material->path) Storage::disk('local')->delete($material->path);
        $material->delete();
        return response()->json(['message' => 'Removed.']);
    }

    // --- Class calendar (Phase 5): month view of classes + assigned demos ---

    public function calendar(Request $request) {
        $tutor = $this->tutorFor($request);
        if (!$tutor) return response()->json(['data' => ['classes' => [], 'demos' => []]]);

        $month = $request->string('month')->toString();
        $start = preg_match('/^\d{4}-\d{2}$/', $month)
            ? \Carbon\Carbon::createFromFormat('Y-m-d', $month.'-01')->startOfMonth()
            : now()->startOfMonth();
        $end = $start->copy()->endOfMonth();

        $classes = ClassLog::whereIn('enrollment_id', $tutor->enrollments()->pluck('id'))
            ->whereBetween('held_on', [$start, $end])
            ->with(['enrollment.student:id,name', 'enrollment.course:id,name'])
            ->orderBy('held_on')->get()
            ->map(fn ($l) => [
                'id'      => $l->id,
                'date'    => $l->held_on->toDateString(),
                'topic'   => $l->topic,
                'status'  => $l->status,
                'student' => $l->enrollment?->student?->name,
                'course'  => $l->enrollment?->course?->name,
            ]);

        $demos = $tutor->assignedDemos()
            ->whereNotNull('scheduled_at')
            ->whereBetween('scheduled_at', [$start, $end])
            ->with('student:id,name')
            ->orderBy('scheduled_at')->get()
            ->map(fn ($d) => [
                'id'      => $d->id,
                'date'    => $d->scheduled_at->toDateString(),
                'time'    => $d->scheduled_at->format('H:i'),
                'subject' => $d->subject,
                'student' => $d->student?->name,
            ]);

        return response()->json(['data' => [
            'month'   => $start->format('Y-m'),
            'classes' => $classes,
            'demos'   => $demos,
        ]]);
    }

    // --- Reschedule requests from parents (Phase 8) ---

    public function reschedules(Request $request) {
        $tutor = $this->tutorFor($request);
        if (!$tutor) return response()->json(['data' => []]);

        $items = RescheduleRequest::whereIn('enrollment_id', $tutor->enrollments()->pluck('id'))
            ->with(['enrollment.student:id,name', 'enrollment.course:id,name'])
            ->latest()->limit(50)->get();

        return response()->json(['data' => $items->map(fn ($r) => [
            'id'             => $r->id,
            'student'        => $r->enrollment?->student?->name,
            'course'         => $r->enrollment?->course?->name,
            'preferred_date' => optional($r->preferred_date)->toDateString(),
            'reason'         => $r->reason,
            'status'         => $r->status,
            'created_at'     => optional($r->created_at)->toDateString(),
        ])]);
    }

    public function decideReschedule(Request $request, RescheduleRequest $reschedule) {
        $tutor = $this->tutorFor($request);
        abort_unless($tutor && $reschedule->enrollment?->tutor_id === $tutor->id, 403, 'Not your class.');
        $data = $request->validate(['status' => 'required|in:accepted,declined']);
        $reschedule->update($data);

        // Tell the parent.
        AppNotification::send(
            $reschedule->requested_by,
            'reschedule_decided',
            'Reschedule ' . $data['status'],
            trim(($reschedule->enrollment?->student?->name ?? 'Your') . "'s reschedule request was {$data['status']}"
                . ($reschedule->preferred_date ? ' (' . $reschedule->preferred_date->toDateString() . ')' : '')),
        );

        return response()->json(['data' => ['id' => $reschedule->id, 'status' => $reschedule->status]]);
    }

    // --- Course proposals (teacher proposes; admin approves) ---

    public function proposals(Request $request) {
        abort_unless($request->user()->isTeacher(), 403, 'Teacher accounts only.');
        return CourseProposalResource::collection($request->user()->courseProposals()->latest()->get());
    }

    public function storeProposal(Request $request) {
        abort_unless($request->user()->isTeacher(), 403, 'Teacher accounts only.');
        $data = $request->validate([
            'title'       => 'required|string|max:160',
            'description' => 'nullable|string|max:2000',
        ]);
        $p = $request->user()->courseProposals()->create($data);
        return (new CourseProposalResource($p))->response()->setStatusCode(201);
    }

    /** The directory tutor linked to the signed-in teacher (null until approved). */
    private function tutorFor(Request $request) {
        abort_unless($request->user()->isTeacher(), 403, 'Teacher accounts only.');
        return $request->user()->tutor;
    }

    /** Ensure the enrollment belongs to the signed-in teacher; returns their tutor. */
    private function authorizeEnrollment(Request $request, Enrollment $enrollment) {
        $tutor = $this->tutorFor($request);
        abort_unless($tutor && $enrollment->tutor_id === $tutor->id, 403, 'This class is not assigned to you.');
        return $tutor;
    }
}
