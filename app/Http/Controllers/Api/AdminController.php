<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Http\Resources\DemoRequestResource;
use App\Http\Resources\EnrollmentResource;
use App\Http\Resources\TutorResource;
use App\Models\DemoRequest;
use App\Models\Enrollment;
use App\Models\Tutor;
use Illuminate\Http\Request;

class AdminController extends Controller {
    public function demoRequests(Request $request) {
        $q = DemoRequest::query()
            ->with(['student:id,name', 'course:id,name,slug', 'assignedTutor:id,name,slug', 'user:id,name,email'])
            ->latest();
        if ($s = $request->string('status')->toString()) $q->where('status', $s);
        return DemoRequestResource::collection($q->paginate(20));
    }

    /** Tutors that match a demo's subject + city (fallback to any if none). */
    public function suggestTutors(DemoRequest $demoRequest) {
        $q = Tutor::published();
        if ($demoRequest->subject) $q->where('subjects', 'like', '%' . $demoRequest->subject . '%');
        if ($demoRequest->city)    $q->where('city', $demoRequest->city);
        $matches = $q->limit(8)->get();
        if ($matches->isEmpty()) $matches = Tutor::published()->limit(8)->get();
        return TutorResource::collection($matches);
    }

    public function assignDemo(Request $request, DemoRequest $demoRequest) {
        $data = $request->validate([
            'assigned_tutor_id' => 'nullable|integer|exists:tutors,id',
            'status'            => 'nullable|in:new,scheduled,converted,closed',
            'scheduled_at'      => 'nullable|date',
        ]);
        $demoRequest->update($data);
        return new DemoRequestResource($demoRequest->fresh()->load(['assignedTutor:id,name,slug', 'student:id,name']));
    }

    /** Convert a demo request into an enrollment (student + tutor + course). */
    public function convert(Request $request, DemoRequest $demoRequest) {
        $data = $request->validate([
            'tutor_id' => 'nullable|integer|exists:tutors,id',
            'plan'     => 'nullable|string|max:60',
        ]);
        abort_if($demoRequest->student_id === null, 422, 'This demo has no linked student to enrol.');

        $enrollment = Enrollment::create([
            'student_id'      => $demoRequest->student_id,
            'tutor_id'        => $data['tutor_id'] ?? $demoRequest->assigned_tutor_id,
            'course_id'       => $demoRequest->course_id,
            'demo_request_id' => $demoRequest->id,
            'plan'            => $data['plan'] ?? null,
            'status'          => 'active',
        ]);
        $demoRequest->update(['status' => 'converted']);

        return (new EnrollmentResource(
            $enrollment->load(['student:id,name', 'tutor:id,name,slug', 'course:id,name,slug'])
        ))->response()->setStatusCode(201);
    }

    public function enrollments() {
        return EnrollmentResource::collection(
            Enrollment::with(['student:id,name', 'tutor:id,name,slug', 'course:id,name,slug'])->latest()->paginate(20)
        );
    }
}
