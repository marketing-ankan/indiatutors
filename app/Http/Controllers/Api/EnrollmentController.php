<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Http\Resources\ClassLogResource;
use App\Http\Resources\ClassMaterialResource;
use App\Http\Resources\CurriculumItemResource;
use App\Http\Resources\EnrollmentResource;
use App\Models\ClassMaterial;
use App\Models\Enrollment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class EnrollmentController extends Controller {
    /** A signed-in parent's enrollments (across all their students). */
    public function myIndex(Request $request) {
        return EnrollmentResource::collection(
            $request->user()->enrollments()
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
        ]]);
    }

    /** Download a shared material — allowed for the owning parent or the assigned teacher. */
    public function downloadMaterial(Request $request, ClassMaterial $material) {
        $enrollment = $material->enrollment;
        $user = $request->user();
        $isParent  = $enrollment->student && $enrollment->student->user_id === $user->id;
        $isTeacher = $user->isTeacher() && $user->tutor && $enrollment->tutor_id === $user->tutor->id;
        abort_unless($isParent || $isTeacher || $user->isAdmin(), 403, 'Not your material.');
        abort_unless($material->path && Storage::disk('local')->exists($material->path), 404, 'No file attached.');

        return Storage::disk('local')->download($material->path, $material->original_name ?? 'material');
    }

    private function authorizeParent(Request $request, Enrollment $enrollment): void {
        abort_unless(
            $enrollment->student && $enrollment->student->user_id === $request->user()->id,
            403, 'This enrollment does not belong to your account.'
        );
    }
}
