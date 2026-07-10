<?php
namespace App\Http\Resources;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CourseProposalResource extends JsonResource {
    public function toArray(Request $request): array {
        return [
            'id'          => $this->id,
            'title'       => $this->title,
            'description' => $this->description,
            'status'      => $this->status,
            'teacher'     => $this->whenLoaded('user', fn () => $this->user ? $this->user->only(['name', 'email']) : null),
            'created_at'  => optional($this->created_at)->toDateString(),
        ];
    }
}
