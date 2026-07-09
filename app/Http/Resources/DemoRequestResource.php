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
            'scheduled_at'   => optional($this->scheduled_at)->toDateTimeString(),
            'course'         => $this->whenLoaded('course', fn () => $this->course?->only(['name', 'slug'])),
            'student'        => $this->whenLoaded('student', fn () => $this->student?->name),
            'assigned_tutor' => $this->whenLoaded('assignedTutor', fn () => $this->assignedTutor ? $this->assignedTutor->only(['id', 'name', 'slug']) : null),
            'account'        => $this->whenLoaded('user', fn () => $this->user ? $this->user->only(['name', 'email']) : null),
            'created_at'     => optional($this->created_at)->toDateString(),
        ];
    }
}
