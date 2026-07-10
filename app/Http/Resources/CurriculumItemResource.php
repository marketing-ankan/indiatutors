<?php
namespace App\Http\Resources;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CurriculumItemResource extends JsonResource {
    public function toArray(Request $request): array {
        return [
            'id'       => $this->id,
            'position' => $this->position,
            'topic'    => $this->topic,
            'details'  => $this->details,
            'status'   => $this->status,
        ];
    }
}
