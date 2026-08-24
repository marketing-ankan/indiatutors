<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\SupportTicketResource;
use App\Models\AppNotification;
use App\Models\AuditLog;
use App\Mail\SupportReplyMail;
use App\Models\SupportTicket;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/** The inbox. Everything a customer or visitor sends now arrives here. */
class AdminSupportController extends Controller
{
    public function index(Request $request)
    {
        $q = SupportTicket::query()
            ->with('user:id,name,email,role')
            ->withCount('messages')
            ->when($request->filled('status'), fn ($b) => $b->where('status', $request->string('status')))
            ->when($request->filled('source'), fn ($b) => $b->where('source', $request->string('source')))
            ->when($request->filled('q'), function ($b) use ($request) {
                $term = '%' . $request->string('q') . '%';
                $b->where(fn ($w) => $w->where('code', 'like', $term)
                    ->orWhere('subject', 'like', $term)->orWhere('name', 'like', $term)
                    ->orWhere('email', 'like', $term)->orWhere('phone', 'like', $term));
            })
            // Waiting-on-us first, then by most recent activity: the queue should
            // open on the work, not on whatever happened last.
            ->orderByRaw("CASE WHEN status = 'open' THEN 0 WHEN status = 'answered' THEN 1 ELSE 2 END")
            ->orderByDesc('last_message_at')->orderByDesc('id');

        $page = $q->paginate(20);
        $page->getCollection()->transform(fn ($t) => [
            'id'         => $t->id,
            'code'       => $t->code,
            'subject'    => $t->subject ?: '(no subject)',
            'status'     => $t->status,
            'source'     => $t->source,
            'category'   => $t->category,
            'name'       => $t->name ?: $t->user?->name,
            'email'      => $t->email ?: $t->user?->email,
            'phone'      => $t->phone,
            'role'       => $t->user?->role,
            'has_account'=> (bool) $t->user_id,
            'messages'   => $t->messages_count,
            'last_message_at' => $t->last_message_at?->toIso8601String(),
            'created_at' => $t->created_at?->toIso8601String(),
        ]);

        return $this->paginated($page, $page->items(), ['counts' => [
            'open'     => SupportTicket::where('status', 'open')->count(),
            'answered' => SupportTicket::where('status', 'answered')->count(),
            'closed'   => SupportTicket::where('status', 'closed')->count(),
        ]]);
    }

    public function show(SupportTicket $ticket)
    {
        return new SupportTicketResource($ticket->load(['messages', 'enrollment.course:id,name']));
    }

    /**
     * Reply to a ticket, and be honest about whether the reply actually went
     * anywhere.
     *
     * This used to end with AppNotification::send($ticket->user_id, ...), which
     * is a silent no-op when that id is null — and it is null for every enquiry
     * that came from the public contact form, because the sender has no account.
     * addMessage() then moved the ticket to `answered`, dropping it out of the
     * open queue. So the whole path succeeded end to end while the person who
     * wrote in received nothing at all, and the ticket disappeared from the one
     * list that would have shown them still waiting.
     *
     * Three ways a reply reaches someone, in order of what we actually have:
     *
     *   account       the in-app thread, which is where they already read it
     *   guest + SMTP  email, to the address they typed into the form
     *   neither       nobody. Which is a fact staff must be told, not hidden.
     *
     * In the third case the message is still recorded — staff wrote it, and
     * that is a record worth keeping — but the ticket stays OPEN, because the
     * work is not done until a human sends it by hand. Leaving the queue is
     * what makes this class of failure invisible.
     */
    public function reply(Request $request, SupportTicket $ticket)
    {
        $data = $request->validate(['message' => ['required', 'string', 'max:5000']]);

        $ticket->addMessage($data['message'], $request->user(), true);

        $delivery = $this->deliverReply($ticket, $data['message']);

        // Undelivered means unfinished. addMessage() has already marked this
        // answered; put it back so it keeps showing up as needing a reply.
        if ($delivery['status'] === 'undelivered') {
            $ticket->forceFill(['status' => 'open'])->save();
        }

        AuditLog::record('support_reply', 'support_ticket', $ticket->id, $ticket->code, [
            'delivery' => $delivery['status'],
        ]);

        return (new SupportTicketResource($ticket->fresh()->load(['messages', 'enrollment.course:id,name'])))
            ->additional(['meta' => ['delivery' => $delivery]]);
    }

    /**
     * @return array{status: string, detail: string}
     */
    private function deliverReply(SupportTicket $ticket, string $body): array
    {
        if ($ticket->user_id) {
            AppNotification::send(
                $ticket->user_id,
                'support_reply',
                'We replied to your message',
                Str::limit($ticket->subject ?: $body, 90),
            );

            return ['status' => 'in_app', 'detail' => 'Shown on their dashboard.'];
        }

        if (! filter_var((string) $ticket->email, FILTER_VALIDATE_EMAIL)) {
            return [
                'status' => 'undelivered',
                'detail' => 'This enquiry has no account and no usable email address. Reply by phone — the ticket stays open until you close it.',
            ];
        }

        // `log` is the default until SMTP is configured. Writing the reply into
        // storage/logs is not delivery, and reporting it as sent is how staff
        // end up believing a queue is cleared. Same call LeadNotifier makes.
        if (config('mail.default') === 'log') {
            return [
                'status' => 'undelivered',
                'detail' => "Email is not configured on this server, so nothing was sent to {$ticket->email}. Send this reply by hand — the ticket stays open until you close it.",
            ];
        }

        try {
            Mail::to($ticket->email)->send(new SupportReplyMail(
                $ticket->code,
                $ticket->subject,
                $body,
                $ticket->name,
            ));
        } catch (\Throwable $e) {
            // A bounced or refused send must not read as a delivered one.
            report($e);

            return [
                'status' => 'undelivered',
                'detail' => "Could not email {$ticket->email}. Send this reply by hand — the ticket stays open until you close it.",
            ];
        }

        return ['status' => 'email', 'detail' => "Emailed to {$ticket->email}."];
    }

    public function update(Request $request, SupportTicket $ticket)
    {
        $data = $request->validate([
            'status'   => ['nullable', Rule::in(SupportTicket::STATUSES)],
            'category' => ['nullable', Rule::in(SupportTicket::CATEGORIES)],
        ]);
        $ticket->update($data);
        AuditLog::record('support_update', 'support_ticket', $ticket->id, $ticket->code, $data);

        return new SupportTicketResource($ticket->fresh()->load(['messages']));
    }
}
