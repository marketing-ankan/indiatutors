<?php
namespace Tests\Feature;

use App\Mail\SupportReplyMail;
use App\Models\AppNotification;
use App\Models\SupportTicket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Does a staff reply actually reach the person who wrote in?
 *
 * The reply path used to end in AppNotification::send($ticket->user_id, ...),
 * which does nothing at all when that id is null — and it is null for every
 * enquiry from the public contact form. The ticket was then marked "answered"
 * and left the open queue. Staff saw a sent reply, the queue emptied, and the
 * person received nothing. Nothing in the system disagreed with any of that,
 * which is why it needs tests rather than a comment.
 */
class SupportReplyDeliveryTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create(['role' => 'admin']);
        Mail::fake();
        Sanctum::actingAs($this->admin);
    }

    private function ticket(array $attrs = []): SupportTicket
    {
        return SupportTicket::create($attrs + [
            'name' => 'Rohit', 'email' => 'rohit@example.test', 'subject' => 'Class times',
            'source' => 'website', 'category' => 'classes', 'status' => 'open',
        ]);
    }

    public function test_a_reply_to_an_account_holder_lands_on_their_dashboard(): void
    {
        $parent = User::factory()->create(['role' => 'parent']);
        $ticket = $this->ticket(['user_id' => $parent->id, 'source' => 'dashboard']);

        $this->postJson("/api/admin/support/{$ticket->id}/messages", ['message' => 'Tuesday at 5pm works.'])
            ->assertOk()
            ->assertJsonPath('meta.delivery.status', 'in_app');

        $this->assertDatabaseHas('app_notifications', ['user_id' => $parent->id, 'type' => 'support_reply']);
        $this->assertSame('answered', $ticket->fresh()->status, 'It reached them, so it is answered.');
        Mail::assertNothingSent();
    }

    public function test_a_guest_reply_is_emailed_when_mail_is_configured(): void
    {
        config(['mail.default' => 'smtp']);
        $ticket = $this->ticket();

        $this->postJson("/api/admin/support/{$ticket->id}/messages", ['message' => 'We teach Chemistry online.'])
            ->assertOk()
            ->assertJsonPath('meta.delivery.status', 'email');

        Mail::assertSent(SupportReplyMail::class, fn ($m) => $m->hasTo('rohit@example.test'));
        $this->assertSame('answered', $ticket->fresh()->status);
    }

    /**
     * The live server still runs MAIL_MAILER=log. Writing the reply into
     * storage/logs is not delivery, and reporting it as sent is exactly how a
     * queue comes to look cleared while nobody has been answered.
     */
    public function test_a_guest_reply_is_not_reported_as_sent_when_mail_only_logs(): void
    {
        config(['mail.default' => 'log']);
        $ticket = $this->ticket();

        $res = $this->postJson("/api/admin/support/{$ticket->id}/messages", ['message' => 'Yes, we do.'])
            ->assertOk()
            ->assertJsonPath('meta.delivery.status', 'undelivered');

        $this->assertStringContainsString('rohit@example.test', $res->json('meta.delivery.detail'),
            'Staff need the address they now have to write to by hand.');

        Mail::assertNothingSent();

        // The message is kept — staff wrote it — but the ticket must stay in the
        // queue, because the work is not finished until a human sends it.
        $this->assertSame('open', $ticket->fresh()->status);
        $this->assertDatabaseHas('support_messages', ['ticket_id' => $ticket->id, 'is_staff' => true]);
    }

    public function test_a_guest_with_no_usable_address_keeps_the_ticket_open(): void
    {
        config(['mail.default' => 'smtp']);
        $ticket = $this->ticket(['email' => null, 'phone' => '9000000000']);

        $this->postJson("/api/admin/support/{$ticket->id}/messages", ['message' => 'Please call us.'])
            ->assertOk()
            ->assertJsonPath('meta.delivery.status', 'undelivered');

        Mail::assertNothingSent();
        $this->assertSame('open', $ticket->fresh()->status);
    }

    /**
     * An undelivered reply must keep counting as work outstanding, or the
     * Overview goes back to reporting a clear desk over an unanswered family.
     */
    public function test_an_undelivered_reply_still_counts_as_a_queue_the_overview_reports(): void
    {
        config(['mail.default' => 'log']);
        $ticket = $this->ticket();

        $this->postJson("/api/admin/support/{$ticket->id}/messages", ['message' => 'Hello.'])->assertOk();

        $this->getJson('/api/admin/overview')->assertOk()
            ->assertJsonPath('data.needs_attention.support_open', 1);
    }
}
