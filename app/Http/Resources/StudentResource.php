<?php
namespace App\Http\Resources;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StudentResource extends JsonResource {
    public function toArray(Request $request): array {
        return [
            'id'            => $this->id,
            'name'          => $this->name,
            'grade'         => $this->grade,
            'board'         => $this->board,
            'subjects'      => $this->subjects,
            'date_of_birth' => optional($this->date_of_birth)->toDateString(),
            'notes'         => $this->notes,
        ];
    }
}
