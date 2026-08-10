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
            // The weekly timetable. Only the live slots — a discontinued class
            // is kept for history, not shown to a family as if it still runs.
            'schedule'   => $this->whenLoaded('schedules', fn () => $this->schedules->where('active', true)->map(fn ($s) => [
                'id'       => $s->id,
                'weekday'  => $s->weekday,
                'day'      => $s->day_name,
                'time'     => $s->start_time,
                'label'    => $s->label,
                'duration_minutes' => $s->duration_minutes,
                'note'     => $s->note,
            ])->values()),
            'created_at' => optional($this->created_at)->toDateString(),
        ];
    }
}
