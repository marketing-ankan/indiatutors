<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * An inbox — the thing this platform has never had.
 *
 * Seven forms post to /api/contact: the footer, the contact page, tutor
 * enquiries from a tutor's profile, curriculum downloads, the pricing page and
 * refer-and-earn. Every one of them lands in `contact_messages`, and NOTHING in
 * the codebase has ever read that table back — no route, no console tab, no
 * export. Each of those people was told "Thanks — we'll be in touch soon."
 *
 * Two tables rather than one because an enquiry that cannot be answered is the
 * same black hole with better storage. A ticket holds the who and the state; the
 * messages are the conversation, from either side.
 *
 * Guests keep working: user_id is nullable and the contact details are stored on
 * the ticket, so a signed-out enquiry is a first-class ticket rather than a
 * lesser thing staff have to look for somewhere else.
 */
return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('support_tickets')) {
            Schema::create('support_tickets', function (Blueprint $t) {
                $t->id();
                $t->string('code', 20)->nullable()->unique();      // SUP-100042, quotable on a call
                $t->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
                // Snapshot, not a join: a guest has no account, and a signed-in
                // user may later change their email without rewriting history.
                $t->string('name', 120)->nullable();
                $t->string('email', 180)->nullable();
                $t->string('phone', 30)->nullable();

                $t->string('subject', 200)->nullable();
                // Where it came from, so staff can tell a tutor enquiry from a
                // billing problem before opening it.
                $t->string('source', 30)->default('website');      // website | dashboard
                $t->string('category', 30)->nullable();            // billing | classes | technical | other
                // Optional context when raised from inside an enrolment.
                $t->foreignId('enrollment_id')->nullable()->constrained()->nullOnDelete();

                // open      — waiting on us
                // answered  — we replied, waiting on them
                // closed    — done
                $t->string('status', 20)->default('open');
                $t->timestamp('last_message_at')->nullable();
                $t->timestamps();

                $t->index('status');
                $t->index('last_message_at');
            });
        }

        if (!Schema::hasTable('support_messages')) {
            Schema::create('support_messages', function (Blueprint $t) {
                $t->id();
                $t->foreignId('ticket_id')->constrained('support_tickets')->cascadeOnDelete();
                $t->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
                // Stored, not derived from the author's current role: a staff
                // member could later be demoted, and that must not silently
                // reattribute what they already said.
                $t->boolean('is_staff')->default(false);
                $t->string('author_label', 120)->nullable();
                $t->text('body');
                $t->timestamps();

                $t->index(['ticket_id', 'id']);
            });
        }

        $this->rescueContactMessages();
    }

    /**
     * Bring every already-submitted enquiry into the inbox.
     *
     * These are real people who filled in a form and were told someone would be
     * in touch. Creating the tables without importing them would leave the
     * backlog exactly as lost as before — the point of this migration is that
     * nobody stays invisible.
     */
    private function rescueContactMessages(): void
    {
        if (!Schema::hasTable('contact_messages')) return;
        // Idempotent: a re-run must not duplicate the backlog.
        if (DB::table('support_tickets')->where('source', 'contact_form')->exists()) return;

        DB::table('contact_messages')->orderBy('id')->chunkById(200, function ($rows) {
            foreach ($rows as $row) {
                $ticketId = DB::table('support_tickets')->insertGetId([
                    'user_id'         => null,
                    'name'            => $row->name,
                    'email'           => $row->email,
                    'phone'           => $row->phone,
                    'subject'         => $row->subject,
                    'source'          => 'contact_form',
                    // Whatever their status column said, nobody could have
                    // replied — there was no way to. They are all still open.
                    'status'          => in_array($row->status, ['closed', 'resolved'], true) ? 'closed' : 'open',
                    'last_message_at' => $row->created_at,
                    'created_at'      => $row->created_at,
                    'updated_at'      => $row->updated_at,
                ]);

                DB::table('support_tickets')->where('id', $ticketId)
                    ->update(['code' => 'SUP-' . (100000 + $ticketId)]);

                DB::table('support_messages')->insert([
                    'ticket_id'    => $ticketId,
                    'user_id'      => null,
                    'is_staff'     => false,
                    'author_label' => $row->name,
                    'body'         => $row->message,
                    'created_at'   => $row->created_at,
                    'updated_at'   => $row->updated_at,
                ]);
            }
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('support_messages');
        Schema::dropIfExists('support_tickets');
    }
};
