<?php
namespace Tests\Feature;

use App\Models\AppNotification;
use App\Models\SupportTicket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * The inbox.
 *
 * The bug this replaces: seven public forms wrote to `contact_messages`, and no
 * route, console tab or export ever read that table. The tests that matter most
 * here are therefore about REACHABILITY — that a message can be seen and
 * answered — not just that it was stored.
 */
class SupportTest extends TestCase
{
    use RefreshDatabase;

    private function parent(): User { return User::factory()->create(['role' => 'parent']); }
    private function admin(): User  { return User::factory()->create(['role' => 'admin']); }

    public function test_a_signed_in_parent_can_raise_a_ticket_and_see_it(): void
    {
        Sanctum::actingAs($p = $this->parent());

        $this->postJson('/api/support/tickets', [
            'subject' => 'Class did not happen on Tuesday',
            'message' => 'Nobody joined the call at 5pm.',
            'category'=> 'classes',
        ])->assertCreated()->assertJsonPath('data.status', 'open');

        $this->getJson('/api/support/tickets')->assertOk()
            ->assertJsonPath('data.0.subject', 'Class did not happen on Tuesday')
            ->assertJsonPath('data.0.messages.0.body', 'Nobody joined the call at 5pm.')
            ->assertJsonPath('data.0.messages.0.is_staff', false);

        $this->assertSame($p->id, SupportTicket::first()->user_id);
    }

    /** The whole point: a reply that reaches them. */
    public function test_staff_reply_reaches_the_customer_and_notifies_them(): void
    {
        Sanctum::actingAs($p = $this->parent());
        $id = $this->postJson('/api/support/tickets', ['subject' => 'Refund', 'message' => 'Charged twice.'])
            ->json('data.id');

        Sanctum::actingAs($this->admin());
        $this->postJson("/api/admin/support/{$id}/messages", ['message' => 'Refunded, sorry about that.'])
            ->assertOk()->assertJsonPath('data.status', 'answered');

        Sanctum::actingAs($p);
        $this->getJson('/api/support/tickets')->assertOk()
            ->assertJsonPath('data.0.messages.1.body', 'Refunded, sorry about that.')
            ->assertJsonPath('data.0.messages.1.is_staff', true);

        $this->assertSame(1, AppNotification::where('user_id', $p->id)->where('type', 'support_reply')->count());
    }

    public function test_a_customer_reply_reopens_the_ticket(): void
    {
        Sanctum::actingAs($p = $this->parent());
        $id = $this->postJson('/api/support/tickets', ['subject' => 'S', 'message' => 'first'])->json('data.id');

        Sanctum::actingAs($this->admin());
        $this->postJson("/api/admin/support/{$id}/messages", ['message' => 'answered'])->assertOk();

        Sanctum::actingAs($p);
        $this->postJson("/api/support/tickets/{$id}/messages", ['message' => 'still broken'])
            ->assertOk()->assertJsonPath('data.status', 'open');
    }

    public function test_one_customer_cannot_read_or_answer_anothers_ticket(): void
    {
        Sanctum::actingAs($this->parent());
        $id = $this->postJson('/api/support/tickets', ['subject' => 'Private', 'message' => 'my bank details'])
            ->json('data.id');

        Sanctum::actingAs($this->parent());   // a different account
        $this->getJson('/api/support/tickets')->assertOk()->assertJsonCount(0, 'data');
        $this->postJson("/api/support/tickets/{$id}/messages", ['message' => 'hello'])->assertForbidden();
        $this->patchJson("/api/support/tickets/{$id}/close")->assertForbidden();
    }

    public function test_the_staff_inbox_is_admin_only(): void
    {
        $this->getJson('/api/admin/support')->assertUnauthorized();

        Sanctum::actingAs($this->parent());
        $this->getJson('/api/admin/support')->assertForbidden();

        Sanctum::actingAs($this->admin());
        $this->getJson('/api/admin/support')->assertOk();
    }

    /**
     * The regression that started all this: a public enquiry must land somewhere
     * a human will actually look.
     */
    public function test_a_public_enquiry_becomes_a_ticket_staff_can_see(): void
    {
        $this->postJson('/api/contact', [
            'name' => 'Priya', 'email' => 'priya@example.test', 'phone' => '9800000000',
            'subject' => 'Tutor enquiry: Angeline', 'message' => 'Is she free on weekends?',
        ])->assertCreated()->assertJsonStructure(['message', 'id', 'code']);

        Sanctum::actingAs($this->admin());
        $this->getJson('/api/admin/support')->assertOk()
            ->assertJsonPath('data.0.subject', 'Tutor enquiry: Angeline')
            ->assertJsonPath('data.0.source', 'contact_form')
            ->assertJsonPath('data.0.has_account', false)
            ->assertJsonPath('data.0.status', 'open');
    }

    /** A guest enquiry sent while signed in should join that account's threads. */
    public function test_a_public_enquiry_from_a_signed_in_browser_attaches_to_the_account(): void
    {
        Sanctum::actingAs($p = $this->parent());

        $this->postJson('/api/contact', ['name' => $p->name, 'message' => 'Hi'])->assertCreated();

        $this->getJson('/api/support/tickets')->assertOk()->assertJsonCount(1, 'data');
    }

    /** Nobody already in the backlog stays invisible. */
    public function test_the_migration_rescues_existing_contact_messages(): void
    {
        // Simulate the pre-existing rows, then re-run the import the migration does.
        DB::table('contact_messages')->insert([
            'name' => 'Old Lead', 'email' => 'old@example.test', 'phone' => '900',
            'subject' => 'Curriculum download', 'message' => 'Please send the PDF.',
            'status' => 'new', 'created_at' => now()->subMonth(), 'updated_at' => now()->subMonth(),
        ]);
        SupportTicket::query()->delete();   // as if the table had just been created

        $migration = require database_path('migrations/2026_08_05_000001_create_support_tables.php');
        $rescue = new \ReflectionMethod($migration, 'rescueContactMessages');
        $rescue->setAccessible(true);
        $rescue->invoke($migration);

        $ticket = SupportTicket::where('source', 'contact_form')->first();
        $this->assertNotNull($ticket, 'An existing contact message was left invisible.');
        $this->assertSame('Old Lead', $ticket->name);
        $this->assertSame('open', $ticket->status, 'Nobody could have replied, so it cannot be resolved.');
        $this->assertSame('Please send the PDF.', $ticket->messages->first()->body);

        // Idempotent — a re-run must not duplicate the backlog.
        $rescue->invoke($migration);
        $this->assertSame(1, SupportTicket::where('source', 'contact_form')->count());
    }
}
