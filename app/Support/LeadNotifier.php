<?php
namespace App\Support;

use App\Mail\NewLeadMail;
use App\Models\AppNotification;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Tells a human that a lead has arrived.
 *
 * Until now, nothing did. A parent could book a demo at 9pm, be told "our team
 * will contact you within 24 hours", and the only trace was a row in a table:
 * no email, no in-app notification, nothing. The lead was found when somebody
 * next happened to open the console. For a business whose whole funnel is the
 * free demo, that is the difference between a working funnel and a leaky one.
 *
 * Two channels, deliberately:
 *
 *  - an in-app notification for every admin, which needs NO credentials and so
 *    works the moment this deploys; it drives the header bell that already
 *    polls every 60 seconds;
 *  - an email, which is the one that reaches somebody who is not looking at the
 *    console — but only once SMTP is configured.
 *
 * Nothing here may break the visitor's request. A lead that was saved but not
 * announced is recoverable; a 500 on the booking form loses the lead outright,
 * so every failure is caught and logged.
 */
class LeadNotifier
{
    /**
     * @param string $kind   'demo' | 'contact' | 'tuition' | 'video_demand'
     * @param array  $lines  label => value, shown in the email and the notification
     */
    public static function announce(string $kind, string $title, array $lines, ?string $adminPath = null): void
    {
        try {
            self::notifyAdminsInApp($kind, $title, $lines, $adminPath);
        } catch (\Throwable $e) {
            Log::warning('LeadNotifier in-app failed: ' . $e->getMessage());
        }

        try {
            self::email($title, $lines, $adminPath);
        } catch (\Throwable $e) {
            // The most common cause is no SMTP configured yet, which is a
            // deployment state rather than a bug — the lead is already saved
            // and already visible in the console.
            Log::warning('LeadNotifier email failed: ' . $e->getMessage());
        }
    }

    private static function notifyAdminsInApp(string $kind, string $title, array $lines, ?string $adminPath): void
    {
        $body = collect($lines)
            ->filter(fn ($v) => filled($v))
            ->map(fn ($v, $k) => "{$k}: {$v}")
            ->implode(' · ');

        // AppNotification::send takes no link; the console tab is named in the
        // body instead so the notification still says where to go.
        $where = $adminPath ? " — see {$adminPath}" : '';

        foreach (User::where('role', 'admin')->pluck('id') as $adminId) {
            AppNotification::send($adminId, "lead_{$kind}", $title, $body . $where);
        }
    }

    /**
     * The staff alert. NOT gated by the lead's contact preferences, and that is
     * deliberate — see ContactPolicy note 2. This tells our own team that
     * somebody asked to be taught; a parent who declined marketing has still
     * asked to be taught, and filtering this on their preference would mean the
     * more privacy-conscious the family, the less likely anybody ever calls
     * them back. The preferences govern messages TO the family, which is a
     * different journey and passes through ContactPolicy.
     */
    private static function email(string $title, array $lines, ?string $adminPath): void
    {
        $to = config('app.lead_notify_email') ?: config('app.admin_email');
        if (!$to) return;

        // `log` is the default until SMTP is set: writing every lead into
        // storage/logs is noise, not delivery, so skip it rather than pretend.
        if (config('mail.default') === 'log') return;

        Mail::to($to)->send(new NewLeadMail($title, $lines, $adminPath));
    }
}
