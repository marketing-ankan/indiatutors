<?php
namespace App\Http\Resources;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClassMaterialResource extends JsonResource {
    public function toArray(Request $request): array {
        return [
            'id'            => $this->id,
            'type'          => $this->type,
            'title'         => $this->title,
            'original_name' => $this->original_name,
            'link_url'      => $this->link_url,
            'has_file'      => $this->path !== null, // path itself is never exposed
            'created_at'    => optional($this->created_at)->toDateString(),
        ];
    }
}
