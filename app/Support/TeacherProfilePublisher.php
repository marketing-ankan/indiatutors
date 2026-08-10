<?php

namespace App\Support;

use App\Models\TeacherProfile;
use App\Models\Tutor;
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
 *   - grades — seeded to the full range at creation and narrowed by staff;
 *     the profile has no field for it, so publishing would blank it.
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

        $tutor = $user->tutor()->first();

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
