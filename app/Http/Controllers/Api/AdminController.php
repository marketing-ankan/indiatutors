<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Http\Resources\CourseProposalResource;
use App\Http\Resources\DemoRequestResource;
use App\Http\Resources\EnrollmentResource;
use App\Http\Resources\TeacherProfileResource;
use App\Http\Resources\TutorResource;
use App\Models\CourseProposal;
use App\Models\DemoRequest;
use App\Models\Enrollment;
use App\Models\TeacherProfile;
use App\Models\Tutor;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

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

    // --- Teacher applications ---
    public function teachers(Request $request) {
        $q = TeacherProfile::query()->with('user:id,name,email')->latest();
        if ($s = $request->string('status')->toString()) $q->where('status', $s);
        return TeacherProfileResource::collection($q->paginate(20));
    }

    public function approveTeacher(Request $request, TeacherProfile $teacherProfile) {
        $data = $request->validate(['status' => 'required|in:pending,approved,rejected']);
        $teacherProfile->update($data);

        // On approval, give the teacher a listed directory tutor (idempotent) so
        // they can be assigned demos and see their own enrollments in the portal.
        if ($data['status'] === 'approved') {
            $this->linkTutor($teacherProfile);
        }

        return new TeacherProfileResource($teacherProfile->fresh()->load('user:id,name,email'));
    }

    // --- Course proposals (teacher-proposed subjects) ---
    public function proposals(Request $request) {
        $q = CourseProposal::query()->with('user:id,name,email')->latest();
        if ($s = $request->string('status')->toString()) $q->where('status', $s);
        return CourseProposalResource::collection($q->paginate(20));
    }

    public function decideProposal(Request $request, CourseProposal $proposal) {
        $data = $request->validate(['status' => 'required|in:pending,approved,rejected']);
        $proposal->update($data);

        // On approval, append the subject to the teacher's directory tutor (if linked).
        if ($data['status'] === 'approved') {
            $tutor = $proposal->user?->tutor;
            if ($tutor) {
                $subjects = array_filter(array_map('trim', explode(',', (string) $tutor->subjects)));
                if (!in_array($proposal->title, $subjects, true)) {
                    $subjects[] = $proposal->title;
                    $tutor->update(['subjects' => implode(', ', $subjects)]);
                }
            }
        }

        return new CourseProposalResource($proposal->fresh()->load('user:id,name,email'));
    }

    /** Create (once) a directory Tutor for an approved teacher, seeded from their profile. */
    private function linkTutor(TeacherProfile $profile): void {
        $user = $profile->user()->first();
        if (!$user || $user->tutor()->exists()) return;

        $base = Str::slug($user->name) ?: 'tutor';
        $slug = $base;
        $i = 2;
        while (Tutor::where('slug', $slug)->exists()) $slug = $base . '-' . $i++;

        Tutor::create([
            'user_id'          => $user->id,
            'name'             => $user->name,
            'slug'             => $slug,
            'tagline'          => $profile->headline,
            'qualification'    => $profile->qualification,
            'experience_years' => $profile->experience_years,
            'subjects'         => $profile->subjects,
            'fee_hourly'       => $profile->fee_hourly ?? 0,
            'city'             => $profile->city,
            'localities'       => $profile->service_areas,
            'languages'        => $profile->languages,
            'teaching_mode'    => $profile->teaching_mode ?? 'online',
            'verified'         => true,
            'is_published'     => true,
            'bio'              => $profile->bio,
        ]);
    }
}
