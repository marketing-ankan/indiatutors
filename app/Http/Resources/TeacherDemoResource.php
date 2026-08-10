<?php
namespace App\Http\Resources;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A demo as the assigned teacher sees it.
 *
 * Parent contact details are withheld until a coordinator releases them
 * (owner's decision, 2026-08-10 — see the migration for why a timestamp rather
 * than a flag). Before that the teacher gets everything they need to judge and
 * schedule the class — subject, grade, board, mode, area, preferred slots —
 * and nothing that identifies or locates the family.
 *
 * The withholding is done HERE, in the resource, rather than by remembering to
 * omit columns at each call site: a field that is only safe because one query
 * happened not to select it is one refactor away from leaking.
 */
class TeacherDemoResource extends JsonResource {
    public function toArray(Request $request): array {
        $released = $this->contactIsReleased();

        return [
            'id'           => $this->id,
            'subject'      => $this->subject,
            'grade'        => $this->grade,
            'board'        => $this->board,
            'mode'         => $this->mode,
            'city'         => $this->city,
            'status'       => $this->status,
            'scheduled_at' => optional($this->scheduled_at)->toDateTimeString(),
            'course'       => $this->whenLoaded('course', fn () => $this->course?->only(['name', 'slug'])),
            'student'      => $this->whenLoaded('student', fn () => $this->student?->name),

            // Told plainly either way, so the portal can explain the wait
            // instead of the teacher assuming the details are simply missing.
            'contact_released'    => $released,
            'contact_released_at' => $released ? $this->contact_released_at->toDateTimeString() : null,
            'contact' => $released ? [
                'name'  => $this->name,
                'phone' => trim(($this->phone_country_code ?? '') . ' ' . ($this->phone ?? '')),
                'email' => $this->email,
            ] : null,

            'slots' => $this->whenLoaded('slots', fn () => $this->slots->map(fn ($s) => [
                'id'         => $s->id,
                'starts_at'  => $s->starts_at->toDateTimeString(),
                'duration_minutes' => $s->duration_minutes,
                'note'       => $s->note,
                'status'     => $s->status,
                'source'     => $s->source,
            ])->values()),
        ];
    }
}
