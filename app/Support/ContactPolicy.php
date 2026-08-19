<?php
namespace App\Support;

use App\Models\User;

/**
 * May we send this person this kind of message on this channel?
 *
 * One place decides, because consent that is re-derived at each call site is
 * consent that will eventually be got wrong at one of them. Every future
 * outbound path — the booking confirmation once SMTP exists, a WhatsApp class
 * reminder, an offers mailer — asks here first.
 *
 * TWO THINGS THIS DELIBERATELY DOES NOT GATE, because gating them would be a
 * bug rather than a courtesy:
 *
 *  1. THE IN-APP BELL. AppNotification writes to the person's own dashboard.
 *     That is not us reaching out to them, it is their own record of their own
 *     classes, and hiding it because they declined WhatsApp would mean a family
 *     could not see that their teacher had proposed a time. Service and
 *     reminder traffic in-app is therefore always allowed; only marketing has
 *     to be opted into on every channel, in-app included.
 *
 *  2. STAFF ALERTS. LeadNotifier tells our own admins that a lead arrived. That
 *     is internal routing, not a message to the lead, and it must fire whatever
 *     the family ticked — a parent who declined marketing has still asked to be
 *     taught, and gating the staff alert on their preference would mean the
 *     more privacy-conscious the family, the more likely we never call them
 *     back. Staff notifications do not pass through here at all.
 */
class ContactPolicy
{
    public const CHANNELS = ['email', 'whatsapp', 'in_app'];

    /** Service = about something they already booked. Reminder = before a class. */
    public const PURPOSES = ['service', 'reminder', 'marketing'];

    public static function allows(?User $user, string $channel, string $purpose): bool
    {
        // We cannot hold consent for somebody we do not have an account for.
        // A guest lead is reached on the details they typed into the form, and
        // that decision belongs to the code holding the form, not to this.
        if (! $user) return false;

        if (! in_array($channel, self::CHANNELS, true)) return false;
        if (! in_array($purpose, self::PURPOSES, true)) return false;

        // Marketing is opt-in everywhere, including in-app. Anything else is
        // opt-out, because it is about something the person actively asked for.
        if ($purpose === 'marketing' && ! $user->marketing_opt_in) return false;

        // See note 1: the bell is their own dashboard, so it is answered before
        // any channel preference is consulted. Switching off class reminders
        // means "stop messaging me before a class", not "hide from me that a
        // class is coming" — reading that as the latter would blank a family's
        // own record of their own timetable. Marketing already returned above,
        // so this only ever lets through things the person asked for.
        if ($channel === 'in_app') return true;

        if ($purpose === 'reminder' && ! $user->class_reminders) return false;

        return match ($channel) {
            'email'    => (bool) $user->notify_email,
            'whatsapp' => (bool) $user->notify_whatsapp,
        };
    }

    /** Recipients of a broadcast, filtered to those who agreed to hear it. */
    public static function filter(iterable $users, string $channel, string $purpose): array
    {
        $out = [];
        foreach ($users as $user) {
            if (self::allows($user, $channel, $purpose)) $out[] = $user;
        }
        return $out;
    }
}
