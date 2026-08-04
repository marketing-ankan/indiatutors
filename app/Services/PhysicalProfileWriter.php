<?php
namespace App\Services;

use App\Models\PhysicalTeachingProfile;
use App\Support\Availability;
use App\Support\GradeScale;
use App\Support\PincodeDirectory;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/**
 * One place that validates and persists a physical-teaching profile, because
 * two front doors write the same row: the public "Become a Teacher" form (no
 * account yet) and the teacher's own dashboard. Duplicating the rules would
 * guarantee they drift, and the half with the looser rules would be the one
 * feeding the matcher.
 *
 * Saves are whole-document: the client sends the profile with its offerings and
 * availability and gets the saved state back. Per-row CRUD for a form that is
 * edited as one screen just invents partial-save states the UI then has to
 * reason about.
 */
class PhysicalProfileWriter
{
    public const GENDERS      = ['female', 'male', 'other', 'undisclosed'];
    public const TRAVEL_MODES = ['walk', 'cycle', 'two_wheeler', 'car', 'public'];
    public const GEO_SOURCES  = ['device', 'pincode', 'approx', 'manual'];
    public const LEVELS       = ['school', 'board', 'competitive', 'skill'];
    public const STATUSES     = ['draft', 'submitted', 'active', 'paused'];

    /**
     * Columns that are NOT NULL with a database default.
     *
     * A freshly created row gets its value from the default, so the API hands
     * the client `null` for it; the client sends that null straight back on the
     * next save, and writing it is a constraint violation, not a reset. Nulls
     * for these keys are dropped rather than written — "not supplied" and
     * "cleared" are the same thing for a column that cannot be empty.
     */
    private const NEVER_NULL = [
        'nationality', 'country', 'service_radius_km', 'status',
        'at_student_home', 'at_own_place', 'at_public_place', 'travel_outside_city',
        'preferred_student_gender', 'teaches_group', 'special_needs_experience', 'police_verified',
    ];

    /** Validation rules for the whole document. Shared by both entry points. */
    public static function rules(): array
    {
        return [
            // Identity
            'gender'         => ['nullable', Rule::in(self::GENDERS)],
            'date_of_birth'  => ['nullable', 'date', 'before:today'],
            'nationality'    => ['nullable', 'string', 'max:60'],
            'languages'      => ['nullable', 'string', 'max:300'],

            // Address
            'address_line1'  => ['nullable', 'string', 'max:190'],
            'address_line2'  => ['nullable', 'string', 'max:190'],
            'landmark'       => ['nullable', 'string', 'max:190'],
            'locality'       => ['nullable', 'string', 'max:120'],
            'city'           => ['nullable', 'string', 'max:120'],
            'district'       => ['nullable', 'string', 'max:120'],
            'state'          => ['nullable', 'string', 'max:120'],
            'pincode'        => ['nullable', 'digits:6'],
            'country'        => ['nullable', 'string', 'max:60'],
            'latitude'       => ['nullable', 'numeric', 'between:-90,90'],
            'longitude'      => ['nullable', 'numeric', 'between:-180,180'],
            'geo_source'     => ['nullable', Rule::in(self::GEO_SOURCES)],
            'geo_accuracy_m' => ['nullable', 'integer', 'min:0', 'max:100000'],

            // Travel
            'service_radius_km'    => ['nullable', 'integer', 'min:0', 'max:100'],
            'extra_pincodes'       => ['nullable', 'string', 'max:400'],
            'travel_mode'          => ['nullable', Rule::in(self::TRAVEL_MODES)],
            'max_travel_minutes'   => ['nullable', 'integer', 'min:0', 'max:300'],
            'travel_outside_city'  => ['nullable', 'boolean'],
            'travel_fee_per_visit' => ['nullable', 'numeric', 'min:0', 'max:100000'],

            // Venue
            'at_student_home'    => ['nullable', 'boolean'],
            'at_own_place'       => ['nullable', 'boolean'],
            'at_public_place'    => ['nullable', 'boolean'],
            'own_place_capacity' => ['nullable', 'integer', 'min:1', 'max:100'],

            // Capacity
            'max_students'             => ['nullable', 'integer', 'min:1', 'max:200'],
            'max_hours_per_week'       => ['nullable', 'integer', 'min:1', 'max:120'],
            'preferred_session_minutes'=> ['nullable', 'integer', 'min:15', 'max:480'],
            'notice_hours'             => ['nullable', 'integer', 'min:0', 'max:720'],
            'available_from'           => ['nullable', 'date'],
            'on_break_until'           => ['nullable', 'date'],

            // Preferences
            'preferred_student_gender' => ['nullable', Rule::in(['any', 'female', 'male'])],
            'teaches_group'            => ['nullable', 'boolean'],
            'max_batch_size'           => ['nullable', 'integer', 'min:1', 'max:60'],
            'special_needs_experience' => ['nullable', 'boolean'],
            'min_fee_hourly'           => ['nullable', 'numeric', 'min:0', 'max:100000'],
            'min_fee_monthly'          => ['nullable', 'numeric', 'min:0', 'max:1000000'],

            // Trust
            'police_verified'    => ['nullable', 'boolean'],
            'police_verified_on' => ['nullable', 'date'],
            'experience_years'   => ['nullable', 'integer', 'min:0', 'max:70'],
            'notes'              => ['nullable', 'string', 'max:2000'],

            // Offerings
            'offerings'                    => ['nullable', 'array', 'max:60'],
            'offerings.*.subject'          => ['required', 'string', 'max:120'],
            'offerings.*.grade_from'       => ['nullable', 'integer', 'min:0', 'max:13'],
            'offerings.*.grade_to'         => ['nullable', 'integer', 'min:0', 'max:13'],
            'offerings.*.boards'           => ['nullable', 'array', 'max:12'],
            'offerings.*.boards.*'         => ['string', 'max:60'],
            'offerings.*.medium'           => ['nullable', 'string', 'max:60'],
            'offerings.*.level'            => ['nullable', Rule::in(self::LEVELS)],
            'offerings.*.exam_target'      => ['nullable', 'string', 'max:120'],
            'offerings.*.fee_hourly'       => ['nullable', 'numeric', 'min:0', 'max:100000'],
            'offerings.*.fee_monthly'      => ['nullable', 'numeric', 'min:0', 'max:1000000'],
            'offerings.*.experience_years' => ['nullable', 'integer', 'min:0', 'max:70'],
            'offerings.*.is_primary'       => ['nullable', 'boolean'],

            // Availability — either the canonical range list or an hour grid;
            // Availability::normalize() accepts both, so the rule stays loose.
            'availability' => ['nullable', 'array'],

            'exceptions'                => ['nullable', 'array', 'max:120'],
            'exceptions.*.date'         => ['required', 'date'],
            'exceptions.*.is_available' => ['nullable', 'boolean'],
            'exceptions.*.start_time'   => ['nullable', 'string', 'max:8'],
            'exceptions.*.end_time'     => ['nullable', 'string', 'max:8'],
            'exceptions.*.reason'       => ['nullable', 'string', 'max:190'],
        ];
    }

    /**
     * Persist a validated document onto $profile and return it fresh.
     *
     * @param array   $data       output of validator()->validated()
     * @param ?string $setStatus  'active' when the teacher pressed Publish,
     *                            'submitted' for a public application awaiting
     *                            review; null leaves the status alone.
     */
    public static function save(PhysicalTeachingProfile $profile, array $data, ?string $setStatus = null): PhysicalTeachingProfile
    {
        $attrs = collect($data)->except(['offerings', 'availability', 'exceptions'])
            ->reject(fn ($v, $k) => $v === null && in_array($k, self::NEVER_NULL, true))
            ->all();

        // Resolve the pincode into district/state/coordinates — see
        // PincodeDirectory::enrich for why a device fix is left alone.
        $attrs['pincode'] ??= $profile->pincode;
        $attrs = PincodeDirectory::enrich($attrs, [
            'latitude' => $profile->latitude, 'geo_source' => $profile->geo_source,
        ]);

        return DB::transaction(function () use ($profile, $attrs, $data, $setStatus) {
            $profile->fill($attrs);

            if ($setStatus) {
                $profile->status = $setStatus;
                $profile->submitted_at ??= now();
            } elseif ($profile->status === null) {
                $profile->status = 'draft';
            }
            $profile->save();

            if (array_key_exists('offerings', $data)) {
                $profile->offerings()->delete();
                foreach ($data['offerings'] ?? [] as $o) {
                    if (trim((string) ($o['subject'] ?? '')) === '') continue;
                    // Swapped bounds are a slip, not a rejection-worthy error —
                    // a teacher who picks "Class 10" then "Class 6" means 6–10.
                    $from = $o['grade_from'] ?? null;
                    $to   = $o['grade_to'] ?? null;
                    if ($from !== null && $to !== null && $from > $to) [$from, $to] = [$to, $from];

                    $profile->offerings()->create([
                        'subject'          => trim($o['subject']),
                        'grade_from'       => $from,
                        'grade_to'         => $to,
                        'boards'           => array_values(array_filter($o['boards'] ?? [])),
                        'medium'           => $o['medium'] ?? null,
                        'level'            => $o['level'] ?? null,
                        'exam_target'      => $o['exam_target'] ?? null,
                        'fee_hourly'       => $o['fee_hourly'] ?? null,
                        'fee_monthly'      => $o['fee_monthly'] ?? null,
                        'experience_years' => $o['experience_years'] ?? null,
                        'is_primary'       => (bool) ($o['is_primary'] ?? false),
                    ]);
                }
            }

            if (array_key_exists('availability', $data)) {
                $profile->slots()->delete();
                foreach (Availability::normalize($data['availability'] ?? []) as $slot) {
                    $profile->slots()->create($slot);
                }
            }

            if (array_key_exists('exceptions', $data)) {
                $profile->exceptions()->delete();
                foreach ($data['exceptions'] ?? [] as $e) {
                    $profile->exceptions()->create([
                        'date'         => $e['date'],
                        'is_available' => (bool) ($e['is_available'] ?? false),
                        'start_time'   => $e['start_time'] ?? null,
                        'end_time'     => $e['end_time'] ?? null,
                        'reason'       => $e['reason'] ?? null,
                    ]);
                }
            }

            // The cheapest floor price the teacher quoted, so the matcher can
            // filter on budget without joining every offering.
            $fees = $profile->offerings()->whereNotNull('fee_hourly')->pluck('fee_hourly');
            if ($fees->isNotEmpty() && $profile->min_fee_hourly === null) {
                $profile->forceFill(['min_fee_hourly' => $fees->min()])->save();
            }

            return $profile->fresh(['offerings', 'slots', 'exceptions']);
        });
    }

    /** Grades arrive as text from the public form; normalise before validating. */
    public static function normalizeGrades(array $offerings): array
    {
        return array_map(function ($o) {
            foreach (['grade_from', 'grade_to'] as $k) {
                if (isset($o[$k]) && !is_int($o[$k])) $o[$k] = GradeScale::parse($o[$k]);
            }
            return $o;
        }, $offerings);
    }
}
