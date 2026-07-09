<?php
namespace App\Http\Resources;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EnrollmentResource extends JsonResource {
    public function toArray(Request $request): array {
        return [
            'id'         => $this->id,
            'status'     => $this->status,
            'plan'       => $this->plan,
            'student'    => $this->whenLoaded('student', fn () => $this->student?->name),
            'tutor'      => $this->whenLoaded('tutor', fn () => $this->tutor ? $this->tutor->only(['name', 'slug']) : null),
            'course'     => $this->whenLoaded('course', fn () => $this->course ? $this->course->only(['name', 'slug']) : null),
            'created_at' => optional($this->created_at)->toDateString(),
        ];
    }
}
