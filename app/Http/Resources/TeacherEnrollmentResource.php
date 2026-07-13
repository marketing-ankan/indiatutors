<?php
namespace App\Http\Resources;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** An enrollment as the teacher sees it: their student roster + class progress. */
class TeacherEnrollmentResource extends JsonResource {
    public function toArray(Request $request): array {
        return [
            'id'            => $this->id,
            'status'        => $this->status,
            'plan'          => $this->plan,
            'student'       => $this->whenLoaded('student', fn () => $this->student?->name),
            'student_id'    => $this->student_id,
            'course'        => $this->whenLoaded('course', fn () => $this->course?->name),
            'classes_count' => $this->when(isset($this->class_logs_count), fn () => (int) $this->class_logs_count),
            'last_class_on' => $this->whenLoaded('classLogs', fn () => optional($this->classLogs->first()?->held_on)->toDateString()),
            'created_at'    => optional($this->created_at)->toDateString(),
        ];
    }
}
