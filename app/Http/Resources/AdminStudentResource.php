<?php
namespace App\Http\Resources;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminStudentResource extends JsonResource {
    public function toArray(Request $request): array {
        return [
            'id'              => $this->id,
            'code'            => $this->code,
            'name'            => $this->name,
            'grade'           => $this->grade,
            'board'           => $this->board,
            'subjects'        => $this->subjects,
            'subjects_count'  => $this->subjects_count,
            'enrollments_count' => $this->whenCounted('enrollments'),
            'parent'          => $this->whenLoaded('user', fn () => $this->user?->only(['id', 'name', 'email'])),
            // Null until someone gives the child their own login. The console
            // offers "create account" rather than a dead "view dashboard".
            'account_user_id' => $this->account_user_id,
            'created_at'      => optional($this->created_at)->toDateString(),
        ];
    }
}
