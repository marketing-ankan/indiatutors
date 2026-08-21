<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Http\Resources\AdminOrderResource;
use App\Http\Resources\AdminUserResource;
use App\Http\Resources\CourseProposalResource;
use App\Http\Resources\DemoRequestResource;
use App\Http\Resources\EnrollmentResource;
use App\Http\Resources\TeacherProfileResource;
use App\Models\AppNotification;
use App\Models\AuditLog;
use App\Models\ClassAbsence;
use App\Models\ClassLog;
use App\Models\ContactMessage;
use App\Models\Course;
use App\Models\CourseProposal;
use App\Models\DemoRequest;
use App\Models\Enrollment;
use App\Models\EnrollmentSchedule;
use App\Models\Order;
use App\Models\RescheduleRequest;
use App\Models\Review;
use App\Models\Student;
use App\Models\SupportTicket;
use App\Models\TeacherApplication;
use App\Models\User;
use App\Models\TeacherProfile;
use App\Models\TuitionRequirement;
use App\Models\Tutor;
use App\Support\SubstituteFinder;
use App\Support\TeacherPerformance;
use App\Support\TutorMatcher;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
// Approving a teacher publishes them to the public directory. Without this
// import the call resolved to App\Http\Controllers\Api\TeacherProfilePublisher
// and fatalled, AFTER the status had already been written.
use App\Support\TeacherProfilePublisher;

class AdminController extends Controller {
    /**
     * Bookings. All five flows of the public form live in this one table — the
     * `type` column tells them apart (demo, group, workshop, free, physical).
     */
    public function demoRequests(Request $request) {
        $q = DemoRequest::query()
            ->with(['student:id,name', 'course:id,name,slug', 'assignedTutor:id,name,slug', 'requestedTutor:id,name,slug', 'user:id,name,email',
                    'slots' => fn ($q) => $q->orderBy('starts_at')])
            ->latest();
        if ($s = $request->string('status')->toString()) $q->where('status', $s);
        if ($t = $request->string('type')->toString())   $q->where('type', $t);
        $this->applyMonth($q, $request->string('month')->toString());
        if ($s = trim($request->string('q')->toString())) {
            $q->where(fn ($w) => $w->where('name', 'like', "%{$s}%")
                ->orWhere('email', 'like', "%{$s}%")
                ->orWhere('phone', 'like', "%{$s}%")
                ->orWhere('subject', 'like', "%{$s}%"));
        }
        return DemoRequestResource::collection($q->paginate(20));
    }

    public function destroyDemoRequest(DemoRequest $demoRequest) {
        $label = trim($demoRequest->name . ' · ' . ($demoRequest->subject ?: $demoRequest->type));
        $id    = $demoRequest->id;
        $demoRequest->delete();
        AuditLog::record('booking_deleted', 'booking', $id, $label);
        return response()->json(['message' => 'Booking deleted.']);
    }

    /** Cart orders (guest checkout), newest first, with status/month/search filters. */
    public function orders(Request $request) {
        $q = Order::query()->with(['items:id,order_id,name,price,qty', 'user:id,name,email'])->latest();
        if ($s = $request->string('status')->toString()) $q->where('status', $s);
        $this->applyMonth($q, $request->string('month')->toString());
        if ($s = trim($request->string('q')->toString())) {
            $q->where(fn ($w) => $w->where('first_name', 'like', "%{$s}%")
                ->orWhere('last_name', 'like', "%{$s}%")
                ->orWhere('email', 'like', "%{$s}%")
                // Staff are given the ORDER NUMBER by the customer, so that
                // is what they will paste in. Searching only the primary key
                // meant the one identifier a caller can read out found nothing.
                ->orWhere('order_number', 'like', "%{$s}%")
                ->orWhere('invoice_number', 'like', "%{$s}%")
                ->orWhere('id', ltrim($s, '#')));
        }
        return AdminOrderResource::collection($q->paginate(20));
    }

    /** Manual settlement until the Razorpay flow is fully live. */
    public function updateOrder(Request $request, Order $order) {
        $data = $request->validate(['status' => 'required|in:pending,paid,cancelled']);
        $before = $order->status;
        $order->update($data);
        // Marking an order paid grants any video-course entitlements it carries.
        if ($data['status'] === 'paid') \App\Http\Controllers\Api\OrderController::grantEntitlements($order->fresh());
        if ($before !== $data['status']) {
            AuditLog::record('order_status', 'order', $order->id, "#{$order->id} · {$order->email}", [
                'from' => $before, 'to' => $data['status'],
            ]);
        }
        return new AdminOrderResource($order->fresh(['items', 'user']));
    }

    /**
     * A paid order is refused deletion on purpose: video entitlements point at
     * it with nullOnDelete, so removing it would leave the buyer's access alive
     * with nothing to justify it. Cancel it instead — that path revokes cleanly.
     */
    public function destroyOrder(Order $order) {
        if ($order->status === 'paid') {
            return response()->json([
                'message' => 'A paid order cannot be deleted — it is the record behind any course access it granted. Cancel it instead.',
            ], 422);
        }
        $id = $order->id;
        $label = "#{$order->id} · {$order->email}";
        $order->delete();
        AuditLog::record('order_deleted', 'order', $id, $label);
        return response()->json(['message' => "Order #{$id} deleted."]);
    }

    /** `YYYY-MM` → a created_at window. Silently ignored when absent or malformed. */
    private function applyMonth($query, string $month): void {
        if (!preg_match('/^\d{4}-\d{2}$/', $month)) return;
        $start = Carbon::createFromFormat('Y-m-d H:i:s', $month . '-01 00:00:00')->startOfMonth();
        $query->whereBetween('created_at', [$start, (clone $start)->endOfMonth()]);
    }

    /**
     * No suggestTutors() here any more.
     *
     * It ranked tutors against a booking's subject and city and handed staff a
     * shortlist — which is matching, and matching belongs to the leads-
     * management software. The console keeps `assignDemo` below, because
     * recording WHO was assigned is what the enrolment, classroom and
     * class-log chain hangs off; it just no longer offers an opinion about who
     * that should be. The picker now lists every published tutor, unranked.
     */
    public function assignDemo(Request $request, DemoRequest $demoRequest) {
        $data = $request->validate([
            'assigned_tutor_id' => 'nullable|integer|exists:tutors,id',
            // Wired to the model constant, not a literal — the two used to
            // drift because the vocabulary lived here AND in the console.
            'status'            => 'nullable|in:' . implode(',', DemoRequest::STATUSES),
            'scheduled_at'      => 'nullable|date',
        ]);

        $before = $demoRequest->status;
        $after  = $data['status'] ?? $before;

        // The demo happened: stamp it once, and never clear it. A timestamp
        // rather than a status lookup, so the fact survives a later status
        // change — it is the conversion denominator and the review gate.
        if (in_array($after, DemoRequest::HELD, true) && $demoRequest->completed_at === null) {
            $data['completed_at'] = now();
        }

        $demoRequest->update($data);

        // Compare the TRANSITION, not the payload. The old check fired on the
        // incoming value, so re-saving an already-scheduled demo sent the
        // parent a second identical notification.
        if ($after === 'scheduled' && $before !== 'scheduled') {
            AppNotification::send(
                $demoRequest->user_id,
                'demo_scheduled',
                'Your demo class is scheduled',
                trim(($demoRequest->subject ?: 'Demo class')
                    . ($demoRequest->scheduled_at ? ' on ' . $demoRequest->scheduled_at->toDayDateTimeString() : '')),
            );
        }

        return new DemoRequestResource($demoRequest->fresh()->load(['assignedTutor:id,name,slug', 'requestedTutor:id,name,slug', 'student:id,name']));
    }

    /**
     * Read-only ranked hints for the booking drawer: which directory tutors
     * fit this demo request. Online bookings have no location to measure, so
     * this ranks on subject / grade / mode / city — each hit is named in
     * `why` so staff see the reasoning, not just an ordering. Physical
     * bookings exclude online-only tutors outright; nothing else is filtered,
     * a weak match is still worth a phone call.
     *
     * The tutor directory is small (tens of rows), so scoring in PHP over the
     * published set is simpler and no slower than pushing CSV-column matching
     * into SQL.
     */
    public function demoSuggestions(DemoRequest $demoRequest) {
        // The Mode select (online / home tutor) is offered on every booking
        // flow, not just the 'physical' one — honour either signal.
        $wantsHome = $demoRequest->type === 'physical' || $demoRequest->mode === 'home';

        // The same matcher the family sees while booking (TutorController::
        // suggestions). Two copies of this scoring would drift, and the first
        // time staff and parent saw different orders nobody could say which was
        // right. What differs between them is only what each side may SEE.
        $rows = TutorMatcher::rank(
            Tutor::published()->get(),
            // Subject first, then the course — and BookingsTab's row renders it
            // the same way round, so the heading a coordinator reads and the
            // shortlist underneath describe one booking identically.
            //
            // Both halves of that were wrong before. The shortlist read only
            // the subject, so a family who picked "Carnatic Vocal Music" from a
            // course page and left the free-text box empty was shown under that
            // heading and matched against nothing, while the site's only vocal
            // teacher went unoffered. The row read the course first, so when
            // the two disagreed the heading described one request and the
            // suggestions answered another.
            $demoRequest->subject ?: $demoRequest->course?->name,
            $demoRequest->grade,
            $demoRequest->city,
            $wantsHome,
        )->take(8);

        // Track record, batched — three queries for the shortlist rather than
        // three per row. Staff only: a conversion rate is an internal
        // management number, not something a visitor reads off a profile.
        $perf = TeacherPerformance::forTutors($rows->pluck('tutor.id')->all());

        return response()->json([
            'data' => $rows->map(fn ($r) => [
                'id'               => $r['tutor']->id,
                'name'             => $r['tutor']->name,
                'subjects'         => $r['tutor']->subjects_list,
                'city'             => $r['tutor']->city,
                'teaching_mode'    => $r['tutor']->teaching_mode,
                'experience_years' => $r['tutor']->experience_years,
                'verified'         => (bool) $r['tutor']->verified,
                'why'              => $r['why'],
                'performance'      => $perf[$r['tutor']->id] ?? null,
            ])->all(),
            'meta' => ['count' => $rows->count()],
        ]);
    }

    /**
     * Release (or withdraw) the family's contact details to the assigned teacher.
     *
     * Owner's rule, 2026-08-10: a teacher sees nothing identifying until a
     * coordinator decides. This is that decision, made explicitly and recorded
     * with a name and a time — most of these students are minors, and the
     * home-tuition side carries a street address.
     *
     * Withdrawing is offered because reassignment happens. It cannot unsee what
     * was already seen, which is exactly why the audit row matters.
     */
    public function releaseDemoContact(Request $request, DemoRequest $demoRequest) {
        $data = $request->validate(['released' => 'required|boolean']);

        abort_if($data['released'] && ! $demoRequest->assigned_tutor_id, 422,
            'Assign a teacher first — there is nobody to release these details to.');

        $demoRequest->update($data['released']
            ? ['contact_released_at' => now(), 'contact_released_by' => $request->user()->id]
            : ['contact_released_at' => null, 'contact_released_by' => null]);

        AuditLog::record(
            $data['released'] ? 'demo_contact_released' : 'demo_contact_withdrawn',
            'booking', $demoRequest->id,
            trim($demoRequest->name . ' · ' . ($demoRequest->subject ?: $demoRequest->type)),
            ['tutor_id' => $demoRequest->assigned_tutor_id],
        );

        return new DemoRequestResource(
            $demoRequest->fresh()->load(['assignedTutor:id,name,slug', 'requestedTutor:id,name,slug', 'student:id,name', 'slots'])
        );
    }

    /**
     * Log a time agreed on the phone — the fallback half of the owner's
     * "in-app by default, phone as fallback" decision.
     *
     * Recorded with source='coordinator' so it is never mistaken for the
     * family's own click. Both end in the same place (a scheduled demo), but
     * only one of them is the family's word, and a dispute months later turns
     * on knowing which.
     */
    public function logDemoSlot(Request $request, DemoRequest $demoRequest) {
        $data = $request->validate([
            'starts_at'        => 'required|date',
            'duration_minutes' => 'nullable|integer|min:15|max:240',
            'note'             => 'nullable|string|max:300',
        ]);

        DB::transaction(function () use ($request, $demoRequest, $data) {
            $slot = $demoRequest->slots()->create([
                'proposed_by'      => $request->user()->id,
                'source'           => 'coordinator',
                'starts_at'        => $data['starts_at'],
                'duration_minutes' => $data['duration_minutes'] ?? 45,
                'note'             => $data['note'] ?? null,
                // Agreed on the call, so it is already settled — there is
                // nobody left to confirm it.
                'status'           => 'accepted',
                'responded_at'     => now(),
            ]);
            // live(), not open(): a time agreed on the phone replaces one the
            // family had already accepted online. Closing only the pending ones
            // left TWO accepted slots on the demo and two entries in the
            // teacher's calendar for a single class.
            $demoRequest->slots()->where('id', '!=', $slot->id)->live()
                ->update(['status' => 'superseded', 'responded_at' => now()]);
            $demoRequest->update(['status' => 'scheduled', 'scheduled_at' => $slot->starts_at]);
        });

        AuditLog::record('demo_slot_logged', 'booking', $demoRequest->id,
            trim($demoRequest->name . ' · ' . ($demoRequest->subject ?: $demoRequest->type)),
            ['starts_at' => $data['starts_at']]);

        return new DemoRequestResource(
            $demoRequest->fresh()->load(['assignedTutor:id,name,slug', 'requestedTutor:id,name,slug', 'student:id,name', 'slots'])
        );
    }

    /**
     * Add a weekly class to an enrolment's timetable.
     *
     * Staff-editable because the demo slot is only a first guess: the family
     * that could manage a Saturday trial often wants Tuesdays once term starts.
     */
    public function addEnrollmentSchedule(Request $request, Enrollment $enrollment) {
        $data = $request->validate([
            'weekday'          => 'required|integer|min:1|max:7',
            'start_time'       => 'required|date_format:H:i',
            'duration_minutes' => 'nullable|integer|min:15|max:240',
            'note'             => 'nullable|string|max:200',
        ]);

        // The unique index is the real guard; this turns the collision into a
        // sentence instead of a 500.
        $exists = $enrollment->schedules()
            ->where('weekday', $data['weekday'])
            ->where('start_time', $data['start_time'] . ':00')
            ->exists();
        abort_if($exists, 422, 'This enrolment already has a class at that time.');

        $enrollment->schedules()->create([
            'weekday'          => $data['weekday'],
            'start_time'       => $data['start_time'] . ':00',
            'duration_minutes' => $data['duration_minutes'] ?? 60,
            'note'             => $data['note'] ?? null,
        ]);

        AuditLog::record('enrollment_schedule_added', 'enrollment', $enrollment->id,
            'Enrolment #' . $enrollment->id, $data);

        return new EnrollmentResource($enrollment->fresh()->load(['student:id,name', 'tutor:id,name,slug', 'course:id,name,slug', 'schedules']));
    }

    /** Stop a weekly class. Kept, not deleted — the timetable has a history. */
    public function removeEnrollmentSchedule(Enrollment $enrollment, EnrollmentSchedule $schedule) {
        abort_if($schedule->enrollment_id !== $enrollment->id, 404, 'That class is not on this enrolment.');

        $schedule->update(['active' => false]);
        AuditLog::record('enrollment_schedule_removed', 'enrollment', $enrollment->id,
            'Enrolment #' . $enrollment->id, ['weekday' => $schedule->weekday, 'start_time' => $schedule->start_time]);

        return new EnrollmentResource($enrollment->fresh()->load(['student:id,name', 'tutor:id,name,slug', 'course:id,name,slug', 'schedules']));
    }

    /**
     * Classes whose teacher called in absent (E2), newest first.
     *
     * The owner's mandate is that this list should be nearly empty: the system
     * assigns cover automatically and a coordinator steps in by exception. So
     * the default view is the exceptions — `requested` and `uncovered` — and
     * `?all=1` shows everything, including what resolved itself. Each row
     * carries the ranked candidates, so an override is a choice from the same
     * shortlist the system used rather than a fresh manual search.
     */
    public function classAbsences(Request $request) {
        $q = ClassAbsence::query()
            ->with(['enrollment.student:id,name', 'enrollment.course:id,name', 'originalTutor:id,name', 'substitute:id,name'])
            ->upcoming()
            ->orderBy('occurs_on');

        if (! $request->boolean('all')) {
            $q->needsAttention();
        }

        $rows = $q->limit(50)->get();

        return response()->json([
            'data' => $rows->map(fn (ClassAbsence $a) => [
                'id'            => $a->id,
                'occurs_on'     => $a->occurs_on->toDateString(),
                'start_time'    => substr((string) $a->start_time, 0, 5),
                'student'       => $a->enrollment?->student?->name,
                'course'        => $a->enrollment?->course?->name,
                'original'      => $a->originalTutor?->only(['id', 'name']),
                'substitute'    => $a->substitute?->only(['id', 'name']),
                'status'        => $a->status,
                'reason'        => $a->reason,
                'auto_assigned' => $a->auto_assigned,
                // Only for rows a human has to act on — computing a shortlist
                // for every settled row would be wasted work.
                'candidates'    => in_array($a->status, ['requested', 'uncovered'], true)
                    ? collect(SubstituteFinder::candidatesFor($a))
                        ->map(fn ($c) => ['id' => $c['tutor']->id, 'name' => $c['tutor']->name, 'why' => $c['why']])->all()
                    : [],
            ])->all(),
            'meta' => ['count' => $rows->count()],
        ]);
    }

    /**
     * Coordinator override: name the substitute yourself, or cancel the class.
     *
     * `auto_assigned` is set false here, which is the point — it is how we can
     * later ask "how often does the automation actually hold?" rather than
     * assuming it does.
     */
    public function updateClassAbsence(Request $request, ClassAbsence $absence) {
        $data = $request->validate([
            'substitute_tutor_id' => 'nullable|integer|exists:tutors,id',
            'status'              => 'nullable|in:covered,uncovered,cancelled',
        ]);

        abort_if(
            ($data['status'] ?? null) === 'covered' && empty($data['substitute_tutor_id']) && ! $absence->substitute_tutor_id,
            422, 'Choose a substitute teacher before marking this covered.'
        );
        abort_if(
            ($data['substitute_tutor_id'] ?? null) && (int) $data['substitute_tutor_id'] === (int) $absence->original_tutor_id,
            422, 'That is the teacher who reported the absence.'
        );

        $absence->update(array_filter([
            'substitute_tutor_id' => $data['substitute_tutor_id'] ?? $absence->substitute_tutor_id,
            'status'              => $data['status'] ?? ($data['substitute_tutor_id'] ?? null ? 'covered' : $absence->status),
        ]) + [
            'auto_assigned' => false,
            'decided_by'    => $request->user()->id,
            'resolved_at'   => now(),
        ]);

        AuditLog::record('class_absence_override', 'enrollment', $absence->enrollment_id,
            'Class on ' . $absence->occurs_on->toDateString(), $data);

        return response()->json(['message' => 'Updated.', 'data' => ['id' => $absence->id, 'status' => $absence->fresh()->status]]);
    }

    /** Convert a demo request into an enrollment (student + tutor + course). */
    public function convert(Request $request, DemoRequest $demoRequest) {
        $data = $request->validate([
            'tutor_id' => 'nullable|integer|exists:tutors,id',
            'plan'     => 'nullable|string|max:60',
        ]);
        abort_if($demoRequest->student_id === null, 422, 'This demo has no linked student to enrol.');
        // Converting twice used to create a SECOND enrolment against the same
        // demo. The relation is hasOne, so the duplicate was invisible in the
        // UI while still counted in the DB — and it would have double-counted
        // this teacher's conversion rate.
        abort_if($demoRequest->enrollment()->exists(), 422, 'This demo has already been converted to an enrolment.');

        $enrollment = Enrollment::create([
            'student_id'      => $demoRequest->student_id,
            // Explicit override wins; then who actually taught it; then who the
            // student chose. Without the last term the family's own choice was
            // silently dropped at the moment of enrolment.
            'tutor_id'        => $data['tutor_id'] ?? $demoRequest->creditedTutorId(),
            'course_id'       => $demoRequest->course_id,
            'demo_request_id' => $demoRequest->id,
            'plan'            => $data['plan'] ?? null,
            'status'          => 'active',
        ]);
        // Converting proves the demo was held, so backfill completed_at for
        // demos converted straight from 'scheduled' without passing through
        // 'completed' — otherwise the denominator loses them.
        $demoRequest->update([
            'status'       => 'converted',
            'completed_at' => $demoRequest->completed_at ?? now(),
        ]);

        // C4: the regular timetable starts from the demo outcome. The slot that
        // suited the family for the demo is the best first guess at the slot
        // that suits them every week — nobody has to re-agree a time they have
        // already agreed once. Staff can edit it afterwards; this is a starting
        // point, not a commitment.
        $agreed = $demoRequest->scheduled_at;
        if ($agreed) {
            $enrollment->schedules()->create([
                'weekday'          => $agreed->dayOfWeekIso,
                'start_time'       => $agreed->format('H:i:s'),
                'duration_minutes' => $demoRequest->slots()->where('status', 'accepted')->value('duration_minutes') ?? 60,
                'note'             => 'Carried over from the demo class',
            ]);
        }

        AppNotification::send(
            $demoRequest->user_id,
            'enrolled',
            'Enrollment confirmed 🎉',
            trim(($demoRequest->student?->name ?? 'Your student') . ' is now enrolled'
                . ($enrollment->course_id && $demoRequest->course ? " in {$demoRequest->course->name}" : '') . '.'),
        );

        return (new EnrollmentResource(
            // schedules included so the console can show the timetable it just
            // carried over from the demo, rather than making staff reload.
            $enrollment->load(['student:id,name', 'tutor:id,name,slug', 'course:id,name,slug', 'schedules'])
        ))->response()->setStatusCode(201);
    }

    public function enrollments() {
        return EnrollmentResource::collection(
            Enrollment::with(['student:id,name', 'tutor:id,name,slug', 'course:id,name,slug', 'schedules'])->latest()->paginate(20)
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
        $before = $teacherProfile->status;
        $teacherProfile->update($data);
        AuditLog::record('teacher_status', 'teacher_profile', $teacherProfile->id, $teacherProfile->user?->name, [
            'from' => $before, 'to' => $data['status'],
        ]);

        // On approval, publish the profile to the public directory so they can
        // be assigned demos and appear to families. Publishing (not the old
        // create-once linkTutor) so re-approving a teacher who edited while
        // pending pushes those edits live too.
        if ($data['status'] === 'approved') {
            TeacherProfilePublisher::publish($teacherProfile);
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

    /**
     * One request that feeds the console's Overview tiles *and* every pill
     * badge. The alternative — nine list calls just to read their totals — is
     * nine round trips to render a tab bar.
     */
    public function overview() {
        $monthStart   = now()->startOfMonth();
        $appsAwaiting = TeacherApplication::whereIn('status', ['pending', 'reviewing'])->count();
        // Applications with no account yet: exactly the rows the Teachers tab
        // merges in on top of the profiles, so the badge matches the list.
        $unclaimedApps = TeacherApplication::whereNotIn('email', User::query()->select('email'))->count();
        $students      = Student::count();
        $courses       = Course::count();

        return response()->json(['data' => [
            'tiles' => [
                'teacher_applications'  => TeacherApplication::count(),
                'applications_awaiting' => $appsAwaiting,
                'bookings_this_month'   => DemoRequest::where('created_at', '>=', $monthStart)->count(),
                'orders_this_month'     => Order::where('created_at', '>=', $monthStart)->count(),
                'parents'               => User::where('role', 'parent')->count(),
                'students'              => $students,
                'teachers'              => User::where('role', 'teacher')->count(),
                'courses'               => $courses,
            ],
            'counts' => [
                'teachers' => TeacherProfile::count() + $unclaimedApps,
                'students' => $students,
                'bookings' => DemoRequest::count(),
                'orders'   => Order::count(),
                'reviews'  => Review::count(),
                'courses'  => $courses,
                'users'    => User::count(),
                'audit'    => AuditLog::count(),
            ],
            // What is sitting unattended. Four of these were missing, and the
            // Overview does not merely omit them — it prints "Nothing waiting
            // on staff right now" in green whenever this list comes back empty.
            // Support tickets, website enquiries, home-tuition requirements and
            // reschedule requests could all be piling up behind that reassurance.
            'needs_attention' => [
                'applications_awaiting' => $appsAwaiting,
                'reviews_pending'       => Review::where('status', 'pending')->count(),
                'bookings_new'          => DemoRequest::where('status', 'new')->count(),
                'proposals_pending'     => CourseProposal::where('status', 'pending')->count(),
                'support_open'          => SupportTicket::where('status', 'open')->count(),
                'messages_new'          => ContactMessage::where('status', 'new')->count(),
                'requirements_open'     => TuitionRequirement::where('status', 'open')->count(),
                'reschedules_pending'   => RescheduleRequest::where('status', 'pending')->count(),
                // A booking with a teacher on it but no date is the stall
                // nothing was watching: it has left the "new" queue, so it
                // reads as handled everywhere, while the family waits for a
                // time that was never set.
                //
                // A positive list of the in-flight statuses, not a blocklist of
                // the finished ones. Every terminal state is legitimately
                // dateless — completed, converted, no_show and closed all are —
                // and naming them to exclude means the next status anybody adds
                // starts silently raising a false alarm. Listing what still
                // needs a date fails the safe way instead.
                'demos_unscheduled'     => DemoRequest::whereNotNull('assigned_tutor_id')
                    ->whereNull('scheduled_at')
                    ->whereIn('status', ['new', 'contacted', 'scheduled'])
                    ->count(),
            ],
        ]]);
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
                // Demos that provably took place — the conversion denominator.
                // 'converted' is a subset of it, so the rate is converted/held,
                // never converted/all-bookings (which would count leads that
                // never got as far as a class).
                'demos_held'         => DemoRequest::held()->count(),
                'demos_converted'    => DemoRequest::where('status', 'converted')->count(),
                'enrollments_active' => Enrollment::where('status', 'active')->count(),
                'classes_logged'     => ClassLog::count(),
                'proposals_pending'  => CourseProposal::where('status', 'pending')->count(),
                'reschedules_pending'=> RescheduleRequest::where('status', 'pending')->count(),
                'orders_total'       => Order::count(),
                'orders_paid'        => Order::where('status', 'paid')->count(),
                'revenue_paid'       => (float) Order::where('status', 'paid')->sum('total'),
                'courses'            => Course::count(),
                'reviews_pending'    => Review::where('status', 'pending')->count(),
            ],
            'demos_by_city'    => $topCounts(DemoRequest::query(), 'city'),
            'demos_by_subject' => $topCounts(DemoRequest::query(), 'subject'),
            'tutors_by_city'   => $topCounts(Tutor::where('is_published', true), 'city'),
            'trend' => [
                'demos'       => $byMonth(DemoRequest::query()),
                'enrollments' => $byMonth(Enrollment::query()),
                'signups'     => $byMonth(User::query()),
                'orders'      => $byMonth(Order::query()),
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

    // ---- Users -------------------------------------------------------------
    // Until now the only way to grant admin access was shell access to the
    // server plus a tinker one-liner. These three endpoints replace that.

    /** Paginated account list, newest first. Optional search + role filter. */
    public function users(Request $request) {
        $q = User::query()->select(['id', 'name', 'email', 'phone', 'role', 'created_at',
                'notify_whatsapp', 'notify_email', 'class_reminders', 'marketing_opt_in'])
            ->withCount(['videoEntitlements', 'students', 'orders'])
            ->with('studentProfile:id,account_user_id')
            ->latest();

        $role = $request->string('role')->toString();
        // "Customer" is not one of User::ROLES — on this platform it means an
        // account that has actually bought something. Guest buyers have no user
        // row at all and are correctly absent.
        if ($role === 'customer')  $q->whereHas('orders');
        elseif ($role !== '')      $q->where('role', $role);

        if ($s = trim($request->string('q')->toString())) {
            $q->where(fn ($w) => $w->where('name', 'like', "%{$s}%")->orWhere('email', 'like', "%{$s}%"));
        }
        return AdminUserResource::collection($q->paginate(20));
    }

    /**
     * Create an account by hand (staff onboarding, a parent who phoned in).
     *
     * The password is always typed by the admin and never generated: a console
     * that mints known-password accounts is a console that mints a way in.
     * Creating another admin additionally needs an explicit confirmation flag,
     * so it can never be the result of a mis-picked dropdown.
     */
    public function storeUser(Request $request) {
        $data = $request->validate([
            'name'          => 'required|string|max:120',
            'email'         => 'required|email|max:180|unique:users,email',
            'password'      => 'required|string|min:10|max:200',
            'role'          => 'required|string|in:' . implode(',', User::ROLES),
            'phone'         => 'nullable|string|max:20',
            'confirm_admin' => 'nullable|boolean',
        ]);

        if ($data['role'] === 'admin' && !$request->boolean('confirm_admin')) {
            return response()->json(['message' => 'Creating another admin needs explicit confirmation.'], 422);
        }

        $user = User::create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'password' => $data['password'],   // 'hashed' cast
            'role'     => $data['role'],
            'phone'    => $data['phone'] ?? null,
        ]);
        AuditLog::record('user_added', 'user', $user->id, "{$user->name} <{$user->email}>", ['role' => $user->role]);

        return (new AdminUserResource($user))->response()->setStatusCode(201);
    }

    /**
     * A student's own login, linked to the child profile a guardian already
     * owns. `user_id` on the student row stays the guardian; `account_user_id`
     * becomes the new account — that is what lets the student dashboard show
     * their classes without handing them the parent's account.
     */
    public function storeStudentAccount(Request $request) {
        $data = $request->validate([
            'parent_user_id' => 'required|integer|exists:users,id',
            'name'           => 'required|string|max:120',
            'email'          => 'required|email|max:180|unique:users,email',
            'password'       => 'required|string|min:10|max:200',
            'student_id'     => 'nullable|integer|exists:students,id',
            'grade'          => 'nullable|string|max:40',
            'board'          => 'nullable|string|max:20',
            'subjects'       => 'nullable|string|max:255',
        ]);

        $student = isset($data['student_id']) ? Student::findOrFail($data['student_id']) : null;
        if ($student) {
            if ($student->user_id !== (int) $data['parent_user_id']) {
                return response()->json(['message' => 'That student belongs to a different parent.'], 422);
            }
            if ($student->account_user_id) {
                return response()->json(['message' => 'That student already has an account.'], 422);
            }
        }

        $user = User::create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'password' => $data['password'],
            'role'     => 'student',
        ]);

        $student ??= Student::create([
            'user_id'  => $data['parent_user_id'],
            'name'     => $data['name'],
            'grade'    => $data['grade'] ?? null,
            'board'    => $data['board'] ?? null,
            'subjects' => $data['subjects'] ?? null,
        ]);
        $student->update(['account_user_id' => $user->id]);
        $student->refresh();

        AuditLog::record('user_added', 'user', $user->id, "{$user->name} <{$user->email}>", ['role' => 'student']);
        AuditLog::record('student_linked', 'student', $student->id, $student->code . ' · ' . $student->name, [
            'account' => $user->email,
        ]);

        return response()->json(['data' => [
            'user'    => (new AdminUserResource($user))->resolve($request),
            'student' => ['id' => $student->id, 'code' => $student->code, 'name' => $student->name],
        ]], 201);
    }

    /** Admin-side edit of someone else's details (AuthController@updateMe is self-service). */
    public function updateUser(Request $request, User $user) {
        $data = $request->validate([
            'name'  => 'required|string|max:120',
            'email' => 'required|email|max:180|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|max:20',
        ]);
        $before = $user->only(['name', 'email', 'phone']);
        $user->update($data);
        AuditLog::record('user_updated', 'user', $user->id, "{$user->name} <{$user->email}>", [
            'from' => $before, 'to' => $user->only(['name', 'email', 'phone']),
        ]);

        return new AdminUserResource($user->fresh());
    }

    /**
     * Delete an account. Three guards, in order of how badly they would hurt:
     * you cannot delete yourself, you cannot delete the last admin, and
     * deleting a guardian needs a second confirmation because students.user_id
     * cascades — their children's profiles, portfolios and enrolments go too.
     */
    public function destroyUser(Request $request, User $user) {
        if ($request->user()->id === $user->id) {
            return response()->json(['message' => 'You cannot delete your own account.'], 422);
        }
        if ($user->isAdmin() && User::where('role', 'admin')->count() <= 1) {
            return response()->json(['message' => 'This is the only admin — promote someone else first.'], 422);
        }

        $children = $user->students()->count();
        if ($children > 0 && !$request->boolean('confirm')) {
            return response()->json([
                'message'  => "Deleting {$user->name} also deletes {$children} student profile(s) and everything attached to them.",
                'students' => $children,
                'requires_confirmation' => true,
            ], 409);
        }

        // Recorded before the delete: afterwards there is no name left to log.
        AuditLog::record('user_deleted', 'user', $user->id, "{$user->name} <{$user->email}>", [
            'role' => $user->role, 'students_deleted' => $children,
        ]);
        $user->delete();

        return response()->json(['message' => 'Account deleted.']);
    }

    /**
     * The console's "View dashboard" — a server-composed, read-only snapshot of
     * what this account can see.
     *
     * Deliberately NOT impersonation: signing in as someone else would mean
     * minting a token for their account, and this app has no policy layer to
     * constrain what that token could then do. Every call is logged.
     */
    public function userDashboard(User $user) {
        $user->loadCount(['students', 'orders']);
        AuditLog::record('user_viewed', 'user', $user->id, "{$user->name} <{$user->email}>");

        $students = $user->students()->withCount('enrollments')->get()
            ->map(fn (Student $s) => [
                'id' => $s->id, 'code' => $s->code, 'name' => $s->name, 'grade' => $s->grade,
                'subjects' => $s->subjects, 'enrollments_count' => $s->enrollments_count,
            ]);

        // A student account reaches its enrolments through its own linked
        // profile; a guardian reaches them through the children they own.
        $studentIds = $user->isStudent() && $user->studentProfile
            ? [$user->studentProfile->id]
            : $user->students()->pluck('id')->all();

        $enrollments = Enrollment::whereIn('student_id', $studentIds)
            ->with(['student:id,name', 'tutor:id,name,slug', 'course:id,name,slug'])
            ->latest()->limit(20)->get()
            ->map(fn (Enrollment $e) => [
                'id' => $e->id, 'student' => $e->student?->name, 'course' => $e->course?->name,
                'tutor' => $e->tutor?->name, 'plan' => $e->plan, 'status' => $e->status,
            ]);

        return response()->json(['data' => [
            'user' => [
                'id' => $user->id, 'name' => $user->name, 'email' => $user->email,
                'phone' => $user->phone ? trim(($user->phone_country_code ?: '') . ' ' . $user->phone) : null,
                'role' => $user->role,
                'joined' => optional($user->created_at)->toDateString(),
                // No last_login column exists, so the honest proxy for "is this
                // account actually in use" is whether it holds a live token.
                'has_active_session' => $user->tokens()->exists(),
                'email_verified'     => $user->email_verified_at !== null,
            ],
            // Identity documents the account has uploaded. File contents stay
            // private — this is the list, not a download.
            'kyc' => $user->kycDocuments()->latest()->get()
                ->map(fn ($d) => [
                    'id' => $d->id, 'type' => $d->type, 'status' => $d->status,
                    'original_name' => $d->original_name,
                    'uploaded' => optional($d->created_at)->toDateString(),
                ]),
            'notifications_count' => $user->appNotifications()->count(),
            'student_profile' => $user->studentProfile
                ? ['id' => $user->studentProfile->id, 'code' => $user->studentProfile->code, 'name' => $user->studentProfile->name]
                : null,
            'students'    => $students,
            'enrollments' => $enrollments,
            'orders'      => AdminOrderResource::collection($user->orders()->with('items')->latest()->limit(10)->get())->resolve(),
            'bookings'    => DemoRequestResource::collection(
                $user->demoRequests()->with(['course:id,name,slug', 'student:id,name'])->latest()->limit(10)->get()
            )->resolve(),
            'video_courses' => $user->videoEntitlements()->with('videoCourse:id,title,slug')->get()
                ->map(fn ($e) => ['title' => $e->videoCourse?->title, 'slug' => $e->videoCourse?->slug])
                ->filter(fn ($c) => $c['title'] !== null)->values(),
            'teacher_profile' => $user->teacherProfile
                ? ['status' => $user->teacherProfile->status, 'headline' => $user->teacherProfile->headline]
                : null,
        ]]);
    }

    /**
     * Change a user's role.
     *
     * Two guards, both about not locking everyone out of the console: an admin
     * cannot demote themselves (the single most likely way to lose access), and
     * the last remaining admin cannot be demoted by anyone.
     */
    public function updateUserRole(Request $request, User $user) {
        $data = $request->validate([
            'role' => 'required|string|in:' . implode(',', User::ROLES),
        ]);

        if ($request->user()->id === $user->id && $data['role'] !== 'admin') {
            return response()->json(['message' => 'You cannot remove your own admin access.'], 422);
        }
        if ($user->isAdmin() && $data['role'] !== 'admin' && User::where('role', 'admin')->count() <= 1) {
            return response()->json(['message' => 'This is the only admin — promote someone else first.'], 422);
        }

        $before = $user->role;
        $user->update(['role' => $data['role']]);
        AuditLog::record('role_changed', 'user', $user->id, "{$user->name} <{$user->email}>", [
            'from' => $before, 'to' => $data['role'],
        ]);

        return response()->json(['data' => $user->only(['id', 'name', 'email', 'role'])]);
    }

    /**
     * Set a user's password. Existing sessions are revoked so a password reset
     * actually ends access on whatever device held the old token.
     */
    public function resetUserPassword(Request $request, User $user) {
        $data = $request->validate(['password' => 'required|string|min:10|max:200']);

        $user->update(['password' => $data['password']]); // 'hashed' cast handles bcrypt
        $user->tokens()->delete();
        AuditLog::record('password_reset', 'user', $user->id, "{$user->name} <{$user->email}>");

        return response()->json(['message' => "Password updated for {$user->email}. Their other sessions were signed out."]);
    }
}
