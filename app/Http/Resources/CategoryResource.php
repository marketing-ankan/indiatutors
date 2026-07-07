<?php
namespace App\Http\Resources;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CategoryResource extends JsonResource {
    public function toArray(Request $request): array {
        return [
            'id'           => $this->id,
            'name'         => $this->name,
            'slug'         => $this->slug,
            'parent_id'    => $this->parent_id,
            'image_url'    => $this->image_url,
            'description'  => $this->description,
            'course_count' => $this->when(isset($this->courses_count), $this->courses_count),
            'children'     => CategoryResource::collection($this->whenLoaded('children')),
        ];
    }
}
