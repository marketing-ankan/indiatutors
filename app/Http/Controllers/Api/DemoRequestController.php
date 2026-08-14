<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Http\Resources\DemoRequestResource;
use App\Models\AppNotification;
use App\Models\DemoRequest;
use App\Models\DemoSlotProposal;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DemoRequestController extends Controller {
    public function store(Request $request) {
        $data = $request->validate([
            'name'               => 'required|string|max:120',
            'email'              => 'required|email|max:180',
            'phone'              => 'required|string|max:20',
            'phone_country_code' => 'nullable|string|max:6',
            'subject'            => 'nullable|string|max:120',
            'grade'              => 'nullable|string|max:40',
            'board'              => 'nullable|string|max:20',
            'mode'               => 'nullable|in:online,home',
            'city'               => 'nullable|string|max:80',
            'country'            => 'nullable|string|max:80',
            'timezone'           => 'nullable|string|max:60',
            'message'            => 'nullable|string|max:2000',
            'whatsapp_consent'   => 'nullable|boolean',
            'marketing_consent'  => 'nullable|boolean',
            'course_id'          => 'nullable|integer|exists:courses,id',
            'student_id'         => 'nullable|integer|exists:students,id',
            // Which of the five booking flows this came from, so the console can
            // filter by it instead of pattern-matching the message text.
            'type'               => 'nullable|in:' . implode(',', DemoRequest::TYPES),
            // The teacher the STUDENT picked from the suggestions/directory.
            // Kept distinct from assigned_tutor_id (which only staff set), so a
            // later coordinator reassignment cannot silently move the
            // conversion credit off the teacher the family actually chose.
            'requested_tutor_id' => 'nullable|integer|exists:tutors,id',
        ]);

        // A student may only request a tutor who is actually listed. `exists`
        // proves the row is real, not that it is public — an unpublished or
        // draft tutor id would otherwise be bookable by anyone who guessed it.
        if (! empty($data['requested_tutor_id'])
            && ! \App\Models\Tutor::published()->whereKey($data['requested_tutor_id'])->exists()) {
            unset($data['requested_tutor_id']);
        }

        // If the request carries a valid bearer token, link it to that account.
        $user = auth('sanctum')->user();
        if ($user) {
            $data['user_id'] = $user->id;
            // Only attach a student the user actually owns.
            if (!empty($data['student_id']) && !$user->students()->whereKey($data['student_id'])->exists()) {
                unset($data['student_id']);
            }
        } else {
            unset($data['student_id']); // guests can't attach a student profile
        }

        $demo = DemoRequest::create($data + ['status' => 'new']);

        // Copy into the LMS (best-effort, after the save — see LmsLeadPush).
        // Course name resolved here because the LMS has no course_id concept.
        $courseName = !empty($data['course_id'])
            ? \App\Models\Course::whereKey($data['course_id'])->value('name')
            : null;
        \App\Support\LmsLeadPush::demoRequest($demo, $courseName);

        // Tell a human. Nothing did until now: the reply below promises contact
        // within 24 hours, and the only trace of the lead was a table row that
        // someone had to go looking for.
        \App\Support\LeadNotifier::announce('demo', 'New demo request: ' . $demo->name, [
            'Name'    => $demo->name,
            'Phone'   => trim(($demo->phone_country_code ?? '') . ' ' . ($demo->phone ?? '')),
            'Email'   => $demo->email,
            'Subject' => $courseName ?: $demo->subject,
            'Grade'   => $demo->grade,
            'Board'   => $demo->board,
            'Mode'    => $demo->mode,
            'City'    => $demo->city,
            'Message' => $demo->message,
        ], '/admin#ac-bookings');

        return response()->json(['message' => 'Demo request received. Our team will contact you within 24 hours.', 'id' => $demo->id], 201);
    }

    /** A signed-in parent's own demo requests (with status). */
    public function myIndex(Request $request) {
        return DemoRequestResource::collection(
            $request->user()->demoRequests()
                ->with(['course:id,name,slug', 'student:id,name', 'requestedTutor:id,name,slug', 'assignedTutor:id,name,slug',
                        'slots' => fn ($q) => $q->whereIn('status', ['proposed', 'accepted'])->orderBy('starts_at')])
                ->latest()->get()
        );
    }

    /**
     * The family accepts one of the proposed times.
     *
     * Accepting is what actually schedules the demo — so it does three things
     * atomically: marks this slot accepted, closes the others (a family cannot
     * hold five tentative bookings against one teacher's calendar), and moves
     * the demo to `scheduled` with the agreed time. In a transaction because
     * two of those three would be wrong on their own.
     */
    public function acceptSlot(Request $request, DemoRequest $demoRequest, DemoSlotProposal $slot) {
        // Ownership is the gate: ids are guessable and this writes to a
        // teacher's calendar.
        abort_if($demoRequest->user_id !== $request->user()->id, 403, 'This booking belongs to another account.');
        abort_if($slot->demo_request_id !== $demoRequest->id, 404, 'That time is not on this booking.');
        abort_if($slot->status !== 'proposed', 422, 'That time is no longer available.');
        abort_if($slot->starts_at->isPast(), 422, 'That time has already passed — please ask for another.');

        DB::transaction(function () use ($demoRequest, $slot) {
            $slot->update(['status' => 'accepted', 'responded_at' => now()]);
            // Competing OPEN offers become declined — the family really did
            // turn them down by choosing another. A previously ACCEPTED slot is
            // marked superseded instead: nobody declined it, a later agreement
            // simply replaced it, and only one accepted slot may ever stand.
            $demoRequest->slots()->where('id', '!=', $slot->id)->open()
                ->update(['status' => 'declined', 'responded_at' => now()]);
            $demoRequest->slots()->where('id', '!=', $slot->id)->where('status', 'accepted')
                ->update(['status' => 'superseded', 'responded_at' => now()]);
            $demoRequest->update(['status' => 'scheduled', 'scheduled_at' => $slot->starts_at]);
        });

        // Tell the teacher their offer was taken — they are the one who has to
        // turn up, and nothing else in the flow would inform them.
        $teacherUserId = $demoRequest->assignedTutor?->user_id;
        if ($teacherUserId) {
            AppNotification::send(
                $teacherUserId,
                'demo_slot_accepted',
                'Your proposed demo time was accepted',
                trim(($demoRequest->subject ?: 'Demo class') . ' on ' . $slot->starts_at->toDayDateTimeString() . '.'),
            );
        }

        return response()->json(['message' => 'Time confirmed. We have let the teacher know.']);
    }

    /** Decline a proposed time, so the teacher knows to offer another. */
    public function declineSlot(Request $request, DemoRequest $demoRequest, DemoSlotProposal $slot) {
        abort_if($demoRequest->user_id !== $request->user()->id, 403, 'This booking belongs to another account.');
        abort_if($slot->demo_request_id !== $demoRequest->id, 404, 'That time is not on this booking.');
        abort_if($slot->status !== 'proposed', 422, 'That time is no longer open.');

        $slot->update(['status' => 'declined', 'responded_at' => now()]);

        $teacherUserId = $demoRequest->assignedTutor?->user_id;
        if ($teacherUserId) {
            AppNotification::send(
                $teacherUserId,
                'demo_slot_declined',
                'A proposed demo time did not suit',
                trim(($demoRequest->subject ?: 'Demo class') . ' — ' . $slot->starts_at->toDayDateTimeString()
                    . ' was declined. Please offer another time.'),
            );
        }

        return response()->json(['message' => 'Time declined. The teacher will suggest another.']);
    }
}
