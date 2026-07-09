<?php
namespace App\Http\Resources;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource {
    public function toArray(Request $request): array {
        return [
            'id'                 => $this->id,
            'name'               => $this->name,
            'email'              => $this->email,
            'role'               => $this->role,
            'phone'              => $this->phone,
            'phone_country_code' => $this->phone_country_code,
            'students_count'     => $this->when(isset($this->students_count), $this->students_count),
            'teacher_profile'    => $this->whenLoaded('teacherProfile'),
            'created_at'         => optional($this->created_at)->toDateString(),
        ];
    }
}
