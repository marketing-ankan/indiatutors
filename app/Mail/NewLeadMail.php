<?php
namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * The "you have a new lead" email.
 *
 * Plain and small on purpose: it is read on a phone, usually in a hurry, and
 * its only job is to carry the contact details and say where to reply. Sent
 * synchronously — Hostinger shared hosting runs no queue worker, so a queued
 * mail would sit in the table forever.
 */
class NewLeadMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $title,
        public array $lines,
        public ?string $adminPath = null,
    ) {}

    public function envelope(): Envelope
    {
        // The lead's own address goes in the body, not Reply-To: a spoofed
        // address would otherwise make a staff reply go somewhere unintended.
        return new Envelope(subject: $this->title);
    }

    public function content(): Content
    {
        return new Content(markdown: 'mail.new-lead');
    }
}
