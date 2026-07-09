<?php
namespace App\Http\Resources;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DemoRequestResource extends JsonResource {
    public function toArray(Request $request): array {
        return [
            'id'         => $this->id,
            'subject'    => $this->subject,
            'grade'      => $this->grade,
            'mode'       => $this->mode,
            'status'     => $this->status,
            'course'     => $this->whenLoaded('course', fn () => $this->course?->only(['name', 'slug'])),
            'student'    => $this->whenLoaded('student', fn () => $this->student?->name),
            'created_at' => optional($this->created_at)->toDateString(),
        ];
    }
}
