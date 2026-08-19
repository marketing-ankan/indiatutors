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
            // Returned, not just accepted. A field a form writes but the
            // resource withholds comes back undefined on the next load and is
            // erased by the following save — the round-trip bug this project
            // has already been bitten by more than once.
            'notify_whatsapp'    => (bool) $this->notify_whatsapp,
            'notify_email'       => (bool) $this->notify_email,
            'class_reminders'    => (bool) $this->class_reminders,
            'marketing_opt_in'   => (bool) $this->marketing_opt_in,
            'students_count'     => $this->when(isset($this->students_count), $this->students_count),
            'teacher_profile'    => $this->whenLoaded('teacherProfile'),
            'student_profile'    => $this->whenLoaded('studentProfile', fn () => $this->studentProfile
                ? $this->studentProfile->only(['id', 'code', 'name', 'grade', 'board', 'subjects'])
                : null),
            'created_at'         => optional($this->created_at)->toDateString(),
        ];
    }
}
