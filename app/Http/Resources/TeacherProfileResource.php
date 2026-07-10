<?php
namespace App\Http\Resources;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TeacherProfileResource extends JsonResource {
    public function toArray(Request $request): array {
        return [
            'id'               => $this->id,
            'headline'         => $this->headline,
            'qualification'    => $this->qualification,
            'subjects'         => $this->subjects,
            'languages'        => $this->languages,
            'experience_years' => $this->experience_years,
            'fee_hourly'       => $this->fee_hourly !== null ? (float) $this->fee_hourly : null,
            'city'             => $this->city,
            'teaching_mode'    => $this->teaching_mode,
            'service_areas'    => $this->service_areas,
            'availability'     => $this->availability ?? ['days' => [], 'slots' => ''],
            'bio'              => $this->bio,
            'status'           => $this->status,
            'teacher'          => $this->whenLoaded('user', fn () => $this->user ? $this->user->only(['name', 'email']) : null),
            'updated_at'       => optional($this->updated_at)->toDateString(),
        ];
    }
}
