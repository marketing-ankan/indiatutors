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
use App\Models\ClassMaterial;
use App\Models\CurriculumItem;
use App\Models\Enrollment;
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

        return TeacherDemoResource::collection(
            $tutor->assignedDemos()
                ->with(['student:id,name', 'course:id,name,slug'])
                ->whereIn('status', ['new', 'scheduled'])
                ->latest()->get()
        );
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
        return (new ClassMaterialResource($material))->response()->setStatusCode(201);
    }

    public function destroyMaterial(Request $request, Enrollment $enrollment, ClassMaterial $material) {
        $this->authorizeEnrollment($request, $enrollment);
        abort_unless($material->enrollment_id === $enrollment->id, 404);
        if ($material->path) Storage::disk('local')->delete($material->path);
        $material->delete();
        return response()->json(['message' => 'Removed.']);
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
