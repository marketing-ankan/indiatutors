<?php
namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class SupportTicketResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'       => $this->id,
            'code'     => $this->code,
            'subject'  => $this->subject,
            'status'   => $this->status,
            'category' => $this->category,
            'source'   => $this->source,
            'enrollment' => $this->whenLoaded('enrollment', fn () => $this->enrollment ? [
                'id'     => $this->enrollment->id,
                'course' => $this->enrollment->course?->name,
            ] : null),
            'messages' => $this->whenLoaded('messages', fn () => $this->messages->map(fn ($m) => [
                'id'      => $m->id,
                'body'    => $m->body,
                'is_staff'=> $m->is_staff,
                'author'  => $m->author_label,
                'sent_at' => $m->created_at?->toIso8601String(),
            ])),
            'last_message_at' => $this->last_message_at?->toIso8601String(),
            'created_at'      => $this->created_at?->toIso8601String(),
        ];
    }
}
