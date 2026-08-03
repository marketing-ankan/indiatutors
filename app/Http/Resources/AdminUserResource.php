<?php
namespace App\Http\Resources;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminUserResource extends JsonResource {
    public function toArray(Request $request): array {
        return [
            'id'         => $this->id,
            'name'       => $this->name,
            'email'      => $this->email,
            'phone'      => $this->phone,
            'role'       => $this->role,
            'students_count'  => $this->whenCounted('students'),
            'orders_count'    => $this->whenCounted('orders'),
            'entitlements'    => $this->whenCounted('videoEntitlements'),
            // Non-null only for a student account that has been linked to a
            // profile — the Users tab uses it to offer "view dashboard".
            'student_profile_id' => $this->whenLoaded('studentProfile', fn () => $this->studentProfile?->id),
            'created_at' => optional($this->created_at)->toDateString(),
        ];
    }
}
