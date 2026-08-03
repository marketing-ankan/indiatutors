<?php
namespace App\Http\Resources;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

// Deliberately separate from CourseResource: that one is the public catalogue
// payload (service-worker cached) and must not grow admin-only fields.
class AdminCourseResource extends JsonResource {
    public function toArray(Request $request): array {
        return [
            'id'            => $this->id,
            'name'          => $this->name,
            'slug'          => $this->slug,
            'sku'           => $this->sku,
            'regular_price' => (float) $this->regular_price,
            'sale_price'    => $this->sale_price !== null ? (float) $this->sale_price : null,
            'is_published'  => (bool) $this->is_published,
            'is_featured'   => (bool) $this->is_featured,
            'position'      => $this->position,
            'image_url'     => $this->image_url,
            'categories'    => $this->whenLoaded('categories', fn () => $this->categories->map->only(['id', 'name'])),
            'reviews_count' => $this->whenCounted('reviews'),
            'created_at'    => optional($this->created_at)->toDateString(),
        ];
    }
}
