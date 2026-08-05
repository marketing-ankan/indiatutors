<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\SupportTicket;
use Illuminate\Http\Request;

class ContactController extends Controller {
    /**
     * Every public enquiry form posts here: the footer, the contact page, tutor
     * enquiries from a tutor's profile, curriculum downloads, the pricing page
     * and refer-and-earn.
     *
     * It used to write to `contact_messages`, and nothing in this codebase has
     * ever read that table back — no route, no console tab, no export. Each of
     * those people was told "we'll be in touch soon" when nobody could have
     * been. It now opens a support ticket, which lands in the console inbox with
     * everything else and can be answered.
     */
    public function store(Request $request) {
        $data = $request->validate([
            'name'    => 'required|string|max:120',
            // Nullable: the tutor-enquiry form (live parity) collects phone as the
            // required channel and treats email as optional.
            'email'   => 'nullable|email|max:180',
            'phone'   => 'nullable|string|max:20',
            'subject' => 'nullable|string|max:200',
            'message' => 'required|string|max:5000',
        ]);

        // Attach it to the account when the browser happens to be signed in, so
        // it joins their dashboard thread instead of arriving as a stranger's
        // message that merely shares an email address.
        $user = auth('sanctum')->user();

        $ticket = SupportTicket::create([
            'user_id' => $user?->id,
            'name'    => $data['name'],
            'email'   => $data['email'] ?? $user?->email,
            'phone'   => $data['phone'] ?? null,
            'subject' => $data['subject'] ?? null,
            'source'  => 'contact_form',
            'status'  => 'open',
        ]);
        $ticket->addMessage($data['message'], $user, false);

        return response()->json([
            'message' => "Thanks — we'll be in touch soon.",
            'id'      => $ticket->id,
            'code'    => $ticket->fresh()->code,
        ], 201);
    }
}
