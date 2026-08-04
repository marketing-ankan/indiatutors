<?php
namespace App\Http\Resources;

use App\Support\Availability;
use App\Support\GradeScale;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * The teacher's own view of their physical-tuition profile — everything they
 * typed, plus the two things only the server knows: whether the address
 * resolved to a real coordinate, and how complete the profile is.
 */
class PhysicalProfileResource extends JsonResource
{
    public function toArray($request): array
    {
        $slots = $this->slots->map(fn ($s) => [
            'id'         => $s->id,
            'weekday'    => $s->weekday,
            'start_time' => $s->start,
            'end_time'   => $s->end,
        ])->all();

        return [
            'id'     => $this->id,
            'status' => $this->status,
            'completeness' => $this->completeness(),

            'gender'        => $this->gender,
            'date_of_birth' => $this->date_of_birth?->toDateString(),
            'nationality'   => $this->nationality,
            'languages'     => $this->languages,

            'address_line1' => $this->address_line1,
            'address_line2' => $this->address_line2,
            'landmark'      => $this->landmark,
            'locality'      => $this->locality,
            'city'          => $this->city,
            'district'      => $this->district,
            'state'         => $this->state,
            'pincode'       => $this->pincode,
            'country'       => $this->country,
            'latitude'      => $this->latitude,
            'longitude'     => $this->longitude,
            'geo_source'    => $this->geo_source,
            'geo_accuracy_m'=> $this->geo_accuracy_m,

            'service_radius_km'    => $this->service_radius_km,
            'extra_pincodes'       => $this->extra_pincodes,
            'travel_mode'          => $this->travel_mode,
            'max_travel_minutes'   => $this->max_travel_minutes,
            'travel_outside_city'  => $this->travel_outside_city,
            'travel_fee_per_visit' => $this->travel_fee_per_visit,

            'at_student_home'    => $this->at_student_home,
            'at_own_place'       => $this->at_own_place,
            'at_public_place'    => $this->at_public_place,
            'own_place_capacity' => $this->own_place_capacity,

            'max_students'              => $this->max_students,
            'max_hours_per_week'        => $this->max_hours_per_week,
            'preferred_session_minutes' => $this->preferred_session_minutes,
            'notice_hours'              => $this->notice_hours,
            'available_from'            => $this->available_from?->toDateString(),
            'on_break_until'            => $this->on_break_until?->toDateString(),

            'preferred_student_gender' => $this->preferred_student_gender,
            'teaches_group'            => $this->teaches_group,
            'max_batch_size'           => $this->max_batch_size,
            'special_needs_experience' => $this->special_needs_experience,
            'min_fee_hourly'           => $this->min_fee_hourly,
            'min_fee_monthly'          => $this->min_fee_monthly,

            'police_verified'    => $this->police_verified,
            'police_verified_on' => $this->police_verified_on?->toDateString(),
            'experience_years'   => $this->experience_years,
            'notes'              => $this->notes,

            'offerings' => $this->offerings->map(fn ($o) => [
                'id'               => $o->id,
                'subject'          => $o->subject,
                'grade_from'       => $o->grade_from,
                'grade_to'         => $o->grade_to,
                'grade_label'      => $o->grade_from === null && $o->grade_to === null
                    ? 'All levels'
                    : trim(GradeScale::label($o->grade_from) . ' – ' . GradeScale::label($o->grade_to), ' –'),
                'boards'           => $o->boards ?? [],
                'medium'           => $o->medium,
                'level'            => $o->level,
                'exam_target'      => $o->exam_target,
                'fee_hourly'       => $o->fee_hourly,
                'fee_monthly'      => $o->fee_monthly,
                'experience_years' => $o->experience_years,
                'is_primary'       => $o->is_primary,
            ])->all(),

            'availability'  => $slots,
            'weekly_hours'  => Availability::weeklyHours(array_map(fn ($s) => [
                'weekday' => $s['weekday'], 'start_time' => $s['start_time'], 'end_time' => $s['end_time'],
            ], $slots)),

            'exceptions' => $this->exceptions->map(fn ($e) => [
                'id'           => $e->id,
                'date'         => $e->date?->toDateString(),
                'is_available' => $e->is_available,
                'start_time'   => $e->start_time ? substr($e->start_time, 0, 5) : null,
                'end_time'     => $e->end_time ? substr($e->end_time, 0, 5) : null,
                'reason'       => $e->reason,
            ])->all(),

            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
