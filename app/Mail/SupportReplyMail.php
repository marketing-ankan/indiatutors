<?php
namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * A staff reply to someone who wrote in without an account.
 *
 * Account holders read replies on their dashboard, where the thread already
 * lives. A guest has no dashboard, so this is the only way the answer reaches
 * them — which is why a reply that cannot be emailed is treated as undelivered
 * rather than quietly filed. See AdminSupportController::reply.
 *
 * Sent synchronously, like NewLeadMail: Hostinger shared hosting runs no queue
 * worker, so a queued mail would sit in the jobs table forever.
 */
class SupportReplyMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $ticketCode,
        public ?string $ticketSubject,
        public string $body,
        public ?string $recipientName = null,
    ) {}

    public function envelope(): Envelope
    {
        // The code goes in the subject so a reply threads back to the right
        // ticket, and so someone ringing up can quote it.
        $subject = $this->ticketSubject
            ? "Re: {$this->ticketSubject} [{$this->ticketCode}]"
            : "Your enquiry [{$this->ticketCode}]";

        return new Envelope(subject: $subject);
    }

    public function content(): Content
    {
        return new Content(markdown: 'mail.support-reply');
    }
}
