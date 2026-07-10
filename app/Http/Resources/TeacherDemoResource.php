<?php
namespace App\Http\Resources;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** A demo as the assigned teacher sees it — no parent PII (email/phone stay with staff). */
class TeacherDemoResource extends JsonResource {
    public function toArray(Request $request): array {
        return [
            'id'           => $this->id,
            'subject'      => $this->subject,
            'grade'        => $this->grade,
            'board'        => $this->board,
            'mode'         => $this->mode,
            'city'         => $this->city,
            'status'       => $this->status,
            'scheduled_at' => optional($this->scheduled_at)->toDateTimeString(),
            'course'       => $this->whenLoaded('course', fn () => $this->course?->only(['name', 'slug'])),
            'student'      => $this->whenLoaded('student', fn () => $this->student?->name),
        ];
    }
}
