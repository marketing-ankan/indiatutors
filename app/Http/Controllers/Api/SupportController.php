<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\SupportTicketResource;
use App\Models\AppNotification;
use App\Models\Enrollment;
use App\Models\SupportTicket;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Support for signed-in parents and students.
 *
 * Until now a customer inside their account had nowhere to go: a reschedule
 * request was the only channel to anyone, and it only reached their teacher and
 * only about moving a class. Everything else — a billing question, a teacher who
 * did not show up, "how do I download the material" — had to leave the product
 * and use the public contact form, which nothing read.
 */
class SupportController extends Controller
{
    /** My tickets, newest activity first, with the whole thread. */
    public function index(Request $request)
    {
        return SupportTicketResource::collection(
            SupportTicket::with(['messages', 'enrollment.course:id,name'])
                ->where('user_id', $request->user()->id)
                ->orderByDesc('last_message_at')->orderByDesc('id')
                ->get()
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'subject'       => ['required', 'string', 'max:200'],
            'message'       => ['required', 'string', 'max:5000'],
            'category'      => ['nullable', Rule::in(SupportTicket::CATEGORIES)],
            'enrollment_id' => ['nullable', 'integer', 'exists:enrollments,id'],
        ]);

        $user = $request->user();

        // Only attach an enrolment the user actually owns — `exists` proves the
        // row is real, not that it is theirs.
        if (!empty($data['enrollment_id']) && !$this->ownsEnrollment($user, $data['enrollment_id'])) {
            unset($data['enrollment_id']);
        }

        $ticket = SupportTicket::create([
            'user_id'       => $user->id,
            'name'          => $user->name,
            'email'         => $user->email,
            'phone'         => $user->phone,
            'subject'       => $data['subject'],
            'category'      => $data['category'] ?? null,
            'enrollment_id' => $data['enrollment_id'] ?? null,
            'source'        => 'dashboard',
            'status'        => 'open',
        ]);
        $ticket->addMessage($data['message'], $user, false);

        return (new SupportTicketResource($ticket->fresh()->load(['messages', 'enrollment.course:id,name'])))
            ->additional(['message' => "Sent — we'll reply here, and you'll get a notification."])
            ->response()->setStatusCode(201);
    }

    public function reply(Request $request, SupportTicket $ticket)
    {
        abort_unless($ticket->user_id === $request->user()->id, 403);

        $data = $request->validate(['message' => ['required', 'string', 'max:5000']]);
        $ticket->addMessage($data['message'], $request->user(), false);

        return new SupportTicketResource($ticket->fresh()->load(['messages', 'enrollment.course:id,name']));
    }

    /** Let someone close their own ticket without waiting for staff. */
    public function close(Request $request, SupportTicket $ticket)
    {
        abort_unless($ticket->user_id === $request->user()->id, 403);
        $ticket->update(['status' => 'closed']);

        return new SupportTicketResource($ticket->fresh()->load(['messages']));
    }

    private function ownsEnrollment($user, int $enrollmentId): bool
    {
        return Enrollment::where('id', $enrollmentId)
            ->whereHas('student', fn ($q) => $q
                ->where('user_id', $user->id)
                ->orWhere('account_user_id', $user->id))
            ->exists();
    }
}
