<?php
namespace App\Http\Resources;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AuditLogResource extends JsonResource {
    public function toArray(Request $request): array {
        return [
            'id'           => $this->id,
            'when'         => optional($this->created_at)->toDateTimeString(),
            'when_human'   => optional($this->created_at)->diffForHumans(),
            'actor'        => $this->actor_label,
            'action'       => $this->action,
            'object_type'  => $this->object_type,
            'object_id'    => $this->object_id,
            'object_label' => $this->object_label,
            'details'      => $this->details,
            'ip_address'   => $this->ip_address,
        ];
    }
}
