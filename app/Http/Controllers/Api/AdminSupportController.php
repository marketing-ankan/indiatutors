<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\SupportTicketResource;
use App\Models\AppNotification;
use App\Models\AuditLog;
use App\Models\SupportTicket;
use Illuminate\Http\Request;
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

    public function reply(Request $request, SupportTicket $ticket)
    {
        $data = $request->validate(['message' => ['required', 'string', 'max:5000']]);

        $ticket->addMessage($data['message'], $request->user(), true);

        // The customer is not sitting on this page. Without a notification the
        // reply is as invisible as the enquiry used to be.
        AppNotification::send(
            $ticket->user_id,
            'support_reply',
            'We replied to your message',
            \Illuminate\Support\Str::limit($ticket->subject ?: $data['message'], 90),
        );

        AuditLog::record('support_reply', 'support_ticket', $ticket->id, $ticket->code);

        return new SupportTicketResource($ticket->fresh()->load(['messages', 'enrollment.course:id,name']));
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
