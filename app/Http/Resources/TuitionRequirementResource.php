<?php
namespace App\Http\Resources;

use App\Support\GradeScale;
use Illuminate\Http\Resources\Json\JsonResource;

class TuitionRequirementResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'          => $this->id,
            'code'        => $this->code,
            'status'      => $this->status,
            'student_id'  => $this->student_id,

            'contact_name'      => $this->contact_name,
            'contact_phone'     => $this->contact_phone,
            'contact_email'     => $this->contact_email,
            'relationship'      => $this->relationship,
            'whatsapp_consent'  => $this->whatsapp_consent,
            'best_time_to_call' => $this->best_time_to_call,

            'learner_name'   => $this->learner_name,
            'learner_gender' => $this->learner_gender,
            'learner_dob'    => $this->learner_dob?->toDateString(),
            'grade'          => $this->grade,
            'grade_label'    => GradeScale::label($this->grade),
            'board'          => $this->board,
            'school'         => $this->school,
            'medium'         => $this->medium,
            'languages'      => $this->languages ?? [],
            'learner_count'  => $this->learner_count,

            'subjects'           => $this->subjects ?? [],
            'goal'               => $this->goal,
            'exam_target'        => $this->exam_target,
            'focus_areas'        => $this->focus_areas,
            'special_needs'      => $this->special_needs,
            'special_needs_note' => $this->special_needs_note,

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

            'venue_preference'        => $this->venue_preference,
            'max_teacher_distance_km' => $this->max_teacher_distance_km,
            'willing_to_travel_km'    => $this->willing_to_travel_km,

            'preferred_days'         => $this->preferred_days ?? [],
            'preferred_time_windows' => $this->preferred_time_windows ?? [],
            'sessions_per_week'      => $this->sessions_per_week,
            'session_minutes'        => $this->session_minutes,
            'start_date'             => $this->start_date?->toDateString(),
            'urgency'                => $this->urgency,

            'budget_min_hourly' => $this->budget_min_hourly,
            'budget_max_hourly' => $this->budget_max_hourly,
            'budget_monthly'    => $this->budget_monthly,

            'preferred_teacher_gender'    => $this->preferred_teacher_gender,
            'preferred_teacher_languages' => $this->preferred_teacher_languages ?? [],
            'min_teacher_experience'      => $this->min_teacher_experience,
            'group_ok'                    => $this->group_ok,

            'notes'      => $this->notes,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
