<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Http\Resources\CourseProposalResource;
use App\Http\Resources\DemoRequestResource;
use App\Http\Resources\EnrollmentResource;
use App\Http\Resources\TeacherProfileResource;
use App\Http\Resources\TutorResource;
use App\Models\AppNotification;
use App\Models\ClassLog;
use App\Models\CourseProposal;
use App\Models\DemoRequest;
use App\Models\Enrollment;
use App\Models\Order;
use App\Models\RescheduleRequest;
use App\Models\Student;
use App\Models\User;
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

    /** Cart orders (guest checkout), newest first, optional status filter. */
    public function orders(Request $request) {
        $q = Order::query()->with('items:id,order_id,name,price,qty')->latest();
        if ($s = $request->string('status')->toString()) $q->where('status', $s);
        return response()->json($q->paginate(20));
    }

    /** Manual settlement until the Razorpay flow is fully live. */
    public function updateOrder(Request $request, Order $order) {
        $data = $request->validate(['status' => 'required|in:pending,paid,cancelled']);
        $order->update($data);
        // Marking an order paid grants any video-course entitlements it carries.
        if ($data['status'] === 'paid') \App\Http\Controllers\Api\OrderController::grantEntitlements($order->fresh());
        return response()->json($order->fresh('items'));
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

        if (($data['status'] ?? null) === 'scheduled') {
            AppNotification::send(
                $demoRequest->user_id,
                'demo_scheduled',
                'Your demo class is scheduled',
                trim(($demoRequest->subject ?: 'Demo class')
                    . ($demoRequest->scheduled_at ? ' on ' . $demoRequest->scheduled_at->toDayDateTimeString() : '')),
            );
        }

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

        AppNotification::send(
            $demoRequest->user_id,
            'enrolled',
            'Enrollment confirmed 🎉',
            trim(($demoRequest->student?->name ?? 'Your student') . ' is now enrolled'
                . ($enrollment->course_id && $demoRequest->course ? " in {$demoRequest->course->name}" : '') . '.'),
        );

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

        AppNotification::send(
            $teacherProfile->user_id,
            'teacher_' . $data['status'],
            'Your teacher application was ' . $data['status'],
            $data['status'] === 'approved'
                ? 'You are now listed in the tutor directory — students can be matched to you.'
                : null,
        );

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

        AppNotification::send(
            $proposal->user_id,
            'proposal_decided',
            "Course proposal \"{$proposal->title}\" was {$data['status']}",
            $data['status'] === 'approved' ? 'It has been added to your teaching subjects.' : null,
        );

        return new CourseProposalResource($proposal->fresh()->load('user:id,name,email'));
    }

    // --- Analytics (Phase 9): headline totals + breakdowns for the staff console ---
    public function analytics() {
        $months = collect(range(5, 0))->map(fn ($i) => now()->subMonths($i)->format('Y-m'));
        $since  = now()->subMonths(6)->startOfMonth();

        // Portable month bucketing (MySQL prod / sqlite tests): bucket in PHP.
        $byMonth = function ($query) use ($months, $since) {
            $counts = $query->where('created_at', '>=', $since)->pluck('created_at')
                ->groupBy(fn ($d) => $d->format('Y-m'))->map->count();
            return $months->map(fn ($m) => ['month' => $m, 'count' => $counts[$m] ?? 0])->values();
        };
        $topCounts = fn ($query, $col, $limit = 8) =>
            $query->whereNotNull($col)->where($col, '!=', '')
                ->selectRaw("$col as label, COUNT(*) as count")
                ->groupBy($col)->orderByDesc('count')->limit($limit)->get();

        return response()->json(['data' => [
            'totals' => [
                'parents'            => User::where('role', 'parent')->count(),
                'teachers'           => User::where('role', 'teacher')->count(),
                'teachers_pending'   => TeacherProfile::where('status', 'pending')->count(),
                'teachers_approved'  => TeacherProfile::where('status', 'approved')->count(),
                'students'           => Student::count(),
                'tutors_listed'      => Tutor::where('is_published', true)->count(),
                'demos_total'        => DemoRequest::count(),
                'demos_new'          => DemoRequest::where('status', 'new')->count(),
                'demos_converted'    => DemoRequest::where('status', 'converted')->count(),
                'enrollments_active' => Enrollment::where('status', 'active')->count(),
                'classes_logged'     => ClassLog::count(),
                'proposals_pending'  => CourseProposal::where('status', 'pending')->count(),
                'reschedules_pending'=> RescheduleRequest::where('status', 'pending')->count(),
            ],
            'demos_by_city'    => $topCounts(DemoRequest::query(), 'city'),
            'demos_by_subject' => $topCounts(DemoRequest::query(), 'subject'),
            'tutors_by_city'   => $topCounts(Tutor::where('is_published', true), 'city'),
            'trend' => [
                'demos'       => $byMonth(DemoRequest::query()),
                'enrollments' => $byMonth(Enrollment::query()),
                'signups'     => $byMonth(User::query()),
            ],
        ]]);
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
            // service_areas holds the teacher's pincodes (Phase 5) — mirror them
            // into the physical-classes matching column. Grades default to the
            // full range until the teacher/admin narrows them.
            'pincodes'         => $profile->service_areas,
            'grades'           => 'Pre-primary, Class 1, Class 2, Class 3, Class 4, Class 5, Class 6, Class 7, Class 8, Class 9, Class 10, Class 11, Class 12',
            'languages'        => $profile->languages,
            'teaching_mode'    => $profile->teaching_mode ?? 'online',
            'verified'         => true,
            'is_published'     => true,
            'bio'              => $profile->bio,
        ]);
    }
}
