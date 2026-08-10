<?php
namespace App\Http\Resources;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DemoRequestResource extends JsonResource {
    public function toArray(Request $request): array {
        return [
            'id'             => $this->id,
            'name'           => $this->name,
            'email'          => $this->email,
            'phone'          => $this->phone,
            'subject'        => $this->subject,
            'grade'          => $this->grade,
            'board'          => $this->board,
            'mode'           => $this->mode,
            'city'           => $this->city,
            'status'         => $this->status,
            'type'           => $this->type ?? 'demo',
            'user_id'        => $this->user_id,
            'student_id'     => $this->student_id,
            'scheduled_at'   => optional($this->scheduled_at)->toDateTimeString(),
            'completed_at'   => optional($this->completed_at)->toDateTimeString(),
            // Whether the assigned teacher has been given this family's contact
            // details. Surfaced so staff can see it at a glance and the family
            // could later be told — it is their data being shared.
            'contact_released_at' => optional($this->contact_released_at)->toDateTimeString(),
            'slots' => $this->whenLoaded('slots', fn () => $this->slots->map(fn ($s) => [
                'id'        => $s->id,
                'starts_at' => $s->starts_at->toDateTimeString(),
                'duration_minutes' => $s->duration_minutes,
                'note'      => $s->note,
                'status'    => $s->status,
                'source'    => $s->source,
            ])->values()),
            'course'         => $this->whenLoaded('course', fn () => $this->course?->only(['name', 'slug'])),
            'student'        => $this->whenLoaded('student', fn () => $this->student?->name),
            'assigned_tutor' => $this->whenLoaded('assignedTutor', fn () => $this->assignedTutor ? $this->assignedTutor->only(['id', 'name', 'slug']) : null),
            // Who the family chose, as opposed to who staff assigned. Shown in
            // the console so a coordinator can see when they differ.
            'requested_tutor'=> $this->whenLoaded('requestedTutor', fn () => $this->requestedTutor ? $this->requestedTutor->only(['id', 'name', 'slug']) : null),
            'account'        => $this->whenLoaded('user', fn () => $this->user ? $this->user->only(['name', 'email']) : null),
            'created_at'     => optional($this->created_at)->toDateString(),
        ];
    }
}
