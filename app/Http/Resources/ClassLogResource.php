<?php
namespace App\Http\Resources;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClassLogResource extends JsonResource {
    public function toArray(Request $request): array {
        return [
            'id'           => $this->id,
            'topic'        => $this->topic,
            'held_on'      => optional($this->held_on)->toDateString(),
            'duration_min' => $this->duration_min,
            'homework'     => $this->homework,
            'notes'        => $this->notes,
            'status'       => $this->status,
        ];
    }
}
