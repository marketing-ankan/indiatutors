<?php
namespace Tests\Feature;

use App\Models\User;
use App\Support\ContactPolicy;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The rules that decide whether we may message somebody.
 *
 * Pinned by tests because the failure modes are silent and opposite: gate too
 * little and we message people who asked us not to; gate too much and a family
 * stops being told their teacher proposed a time, which looks exactly like the
 * product being broken.
 */
class ContactPolicyTest extends TestCase
{
    use RefreshDatabase;

    private function user(array $prefs = []): User
    {
        return User::factory()->create($prefs + [
            'notify_whatsapp'  => true,
            'notify_email'     => true,
            'class_reminders'  => true,
            'marketing_opt_in' => false,
        ]);
    }

    public function test_service_messages_follow_the_channel_switches(): void
    {
        $u = $this->user(['notify_email' => false]);

        $this->assertFalse(ContactPolicy::allows($u, 'email', 'service'));
        $this->assertTrue(ContactPolicy::allows($u, 'whatsapp', 'service'));
    }

    public function test_marketing_is_opt_in_on_every_channel(): void
    {
        $u = $this->user();   // marketing_opt_in false by default

        $this->assertFalse(ContactPolicy::allows($u, 'email', 'marketing'));
        $this->assertFalse(ContactPolicy::allows($u, 'whatsapp', 'marketing'));
        // In-app included: an unsolicited offer in the bell is still marketing.
        $this->assertFalse(ContactPolicy::allows($u, 'in_app', 'marketing'));

        $u->update(['marketing_opt_in' => true]);
        $this->assertTrue(ContactPolicy::allows($u->fresh(), 'email', 'marketing'));
    }

    public function test_marketing_still_needs_the_channel_to_be_on(): void
    {
        $u = $this->user(['marketing_opt_in' => true, 'notify_email' => false]);

        $this->assertFalse(ContactPolicy::allows($u, 'email', 'marketing'));
        $this->assertTrue(ContactPolicy::allows($u, 'whatsapp', 'marketing'));
    }

    public function test_reminders_can_be_switched_off_without_losing_service_messages(): void
    {
        $u = $this->user(['class_reminders' => false]);

        $this->assertFalse(ContactPolicy::allows($u, 'email', 'reminder'));
        // Still told that the class itself moved, or that a substitute is coming.
        $this->assertTrue(ContactPolicy::allows($u, 'email', 'service'));
    }

    /** The bell is their own dashboard, not us reaching out. */
    public function test_the_in_app_bell_is_never_suppressed_for_service_or_reminders(): void
    {
        $u = $this->user([
            'notify_email'    => false,
            'notify_whatsapp' => false,
            'class_reminders' => false,
        ]);

        $this->assertTrue(ContactPolicy::allows($u, 'in_app', 'service'));
        // Even with reminders off: switching off reminder EMAILS must not blank
        // the person's own record of what is coming up.
        $this->assertTrue(ContactPolicy::allows($u, 'in_app', 'reminder'));
    }

    public function test_nobody_is_contactable_without_an_account(): void
    {
        $this->assertFalse(ContactPolicy::allows(null, 'email', 'service'));
    }

    public function test_unknown_channels_and_purposes_are_refused_not_allowed(): void
    {
        $u = $this->user();

        $this->assertFalse(ContactPolicy::allows($u, 'sms', 'service'));
        $this->assertFalse(ContactPolicy::allows($u, 'email', 'newsletter'));
    }

    public function test_filter_keeps_only_the_people_who_agreed(): void
    {
        $yes = $this->user(['marketing_opt_in' => true]);
        $no  = $this->user();

        $kept = ContactPolicy::filter([$yes, $no], 'email', 'marketing');

        $this->assertCount(1, $kept);
        $this->assertSame($yes->id, $kept[0]->id);
    }

    public function test_the_model_helper_agrees_with_the_policy(): void
    {
        $u = $this->user(['notify_whatsapp' => false]);

        $this->assertFalse($u->acceptsContact('whatsapp'));
        $this->assertTrue($u->acceptsContact('email'));
    }
}
