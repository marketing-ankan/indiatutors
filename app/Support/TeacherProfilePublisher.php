<?php

namespace App\Support;

use App\Models\AuditLog;
use App\Models\TeacherProfile;
use App\Models\Tutor;
use App\Models\User;
use Illuminate\Support\Str;

/**
 * The one place that turns a teacher's private profile into their public
 * directory listing.
 *
 * It exists because there used to be no such place: AdminController::linkTutor
 * built a `tutors` row at approval and nothing ever updated it again, so the
 * public page drifted from the teacher's own details from day two onward. A
 * create path and an update path written separately would drift in the same way
 * — one field added to the form and forgotten in the other copy is all it takes
 * — so both go through FIELDS below.
 *
 * What is NOT published from the profile:
 *   - is_published — whether a teacher is listed is a staff decision
 *     (AdminTeacherController::toggleListing), not a consequence of them
 *     editing their bio.
 *   - verified — a claim about checks WE performed. A teacher must never be
 *     able to set it by saving a form.
 *   - slug — the public URL. Renaming yourself must not break inbound links
 *     or reviews already pointing at the old address.
 *
 * Grades ARE published now, but only when the teacher has actually stated
 * them. The profile had no field for years, so the full Pre-primary-to-Class-12
 * range seeded at creation was every teacher's permanent public claim — untrue
 * for most of them, and useless for matching, since a signal every teacher
 * matches cannot tell any two apart. A blank still means "not stated", and
 * payload() drops it so an unanswered field never wipes a range staff narrowed
 * by hand.
 */
class TeacherProfilePublisher
{
    /**
     * profile column => tutor column. The whole contract, in one list.
     */
    private const FIELDS = [
        'headline'         => 'tagline',
        'qualification'    => 'qualification',
        'experience_years' => 'experience_years',
        'subjects'         => 'subjects',
        'grades'           => 'grades',
        'city'             => 'city',
        'languages'        => 'languages',
        'teaching_mode'    => 'teaching_mode',
        'service_areas'    => 'localities',
        'bio'              => 'bio',
    ];

    /** What the public row would become if this profile were published now. */
    public static function payload(TeacherProfile $profile): array
    {
        $out = [];
        foreach (self::FIELDS as $from => $to) {
            $out[$to] = $profile->{$from};
        }
        // service_areas is the teacher's pincode list; the physical-matching
        // column reads it too (see linkTutor's original note).
        $out['pincodes']   = $profile->service_areas;

        // A field the teacher has never filled in is absent, not blank. Copying
        // the null through wrote it straight into columns the tutors table
        // declares NOT NULL with a default — teaching_mode is the one that bit —
        // so publishing a profile that had not been filled in yet threw an
        // integrity violation on BOTH the create and the update path, and
        // approving such a teacher 500'd. Dropping nulls also stops a
        // half-filled profile blanking details already live on the listing.
        // '' is kept: that is a field deliberately cleared, not one never set.
        // Grades are the exception to the ''-is-deliberate rule below. The
        // field is a set of checkboxes whose natural unanswered state is empty,
        // and publishing that empty would blank a range staff may have narrowed
        // by hand — and leave the teacher matching no class at all. Empty here
        // means "not stated", so it is dropped like a null.
        if (($out['grades'] ?? null) !== null && trim((string) $out['grades']) === '') {
            unset($out['grades']);
        }

        $out = array_filter($out, static fn ($v) => $v !== null);
        // A null fee would render as "₹0 per hour" on the public card, which is
        // a price nobody offered.
        $out['fee_hourly'] = $profile->fee_hourly ?? 0;

        return $out;
    }

    /**
     * Fields where the profile and the live listing currently disagree, as
     * ['field' => ['from' => live, 'to' => proposed]]. Staff see what they are
     * approving instead of a bare "this teacher changed something".
     */
    public static function diff(TeacherProfile $profile, ?Tutor $tutor): array
    {
        if (! $tutor) {
            return [];
        }
        $changes = [];
        foreach (self::payload($profile) as $column => $proposed) {
            $live = $tutor->{$column};
            // Loose compare on purpose: '800.00' from a decimal cast and 800
            // from a form are the same price, and flagging that as a change
            // would train staff to click through a diff that is always dirty.
            if ((string) $live !== (string) $proposed) {
                $changes[$column] = ['from' => $live, 'to' => $proposed];
            }
        }
        return $changes;
    }

    /**
     * Publish the profile to the public listing, creating it on first approval.
     * Returns the tutor row, or null when there is no user to attach it to.
     */
    public static function publish(TeacherProfile $profile): ?Tutor
    {
        $user = $profile->user()->first();
        if (! $user) {
            return null;
        }

        $tutor = $user->tutor()->first() ?? self::adoptExistingListing($user);

        if ($tutor) {
            $tutor->update(self::payload($profile));
        } else {
            $tutor = Tutor::create(self::payload($profile) + [
                'user_id' => $user->id,
                'name'    => $user->name,
                'slug'    => self::uniqueSlug($user->name),
                // Full range until staff narrow it — the profile has no grades
                // field, so there is nothing to publish here.
                'grades'  => 'Pre-primary, Class 1, Class 2, Class 3, Class 4, Class 5, Class 6, Class 7, Class 8, Class 9, Class 10, Class 11, Class 12',
            ]);
        }

        $profile->forceFill(['changes_submitted_at' => null, 'published_at' => now()])->save();

        return $tutor;
    }

    /**
     * Claim the teacher's EXISTING public listing instead of building a second one.
     *
     * The listings seeded before accounts existed carry user_id = NULL, so when
     * one of those teachers got an account, $user->tutor() found nothing and a
     * duplicate row was created — "angeline-2" — while the original listing, the
     * one parents had been visiting and search engines had indexed, was left
     * orphaned and frozen. Adopting keeps the original row AND its slug, so the
     * public URL does not change.
     *
     * Deliberately conservative. It adopts only when EXACTLY ONE unclaimed
     * listing carries that name, because the failure modes are not symmetrical:
     * creating a spare listing is untidy and an admin can merge it, whereas
     * attaching the wrong person hands one teacher control of another teacher's
     * public page. On any ambiguity it declines and lets the old create path run.
     */
    private static function adoptExistingListing(User $user): ?Tutor
    {
        $name = trim((string) $user->name);
        if ($name === '') {
            return null;
        }

        $candidates = Tutor::whereNull('user_id')
            ->whereRaw('LOWER(TRIM(name)) = ?', [mb_strtolower($name)])
            ->limit(2)
            ->get();

        if ($candidates->count() !== 1) {
            return null;
        }

        $tutor = $candidates->first();
        $tutor->forceFill(['user_id' => $user->id])->save();

        // Logged because this is the one step that happens without anyone asking
        // for it — if it ever binds the wrong pair, this is how it gets noticed.
        AuditLog::record('tutor_listing_adopted', 'tutor', $tutor->id, $tutor->slug, [
            'user_id'   => $user->id,
            'user_name' => $user->name,
            'matched_on' => 'exact name, single unclaimed listing',
        ]);

        return $tutor;
    }

    private static function uniqueSlug(string $name): string
    {
        $base = Str::slug($name) ?: 'tutor';
        $slug = $base;
        $i    = 2;
        while (Tutor::where('slug', $slug)->exists()) {
            $slug = $base . '-' . $i++;
        }
        return $slug;
    }
}
