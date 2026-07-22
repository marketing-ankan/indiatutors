<?php
namespace App\Http\Resources;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CourseResource extends JsonResource {
    public function toArray(Request $request): array {
        return [
            'id'                => $this->id,
            'sku'               => $this->sku,
            'name'              => $this->name,
            'slug'              => $this->slug,
            'subtitle'          => $this->subtitle,
            'short_description' => $this->short_description,
            'age'               => $this->age,
            'pills'             => $this->pills ?? [],
            'description'       => $this->when($request->routeIs('api.courses.show'), $this->description),
            'curriculum'        => $this->when($request->routeIs('api.courses.show'), $this->curriculum ?? []),
            'curriculum_variants' => $this->when($request->routeIs('api.courses.show'), $this->curriculum_variants),
            'regular_price'     => (float)$this->regular_price,
            'sale_price'        => $this->sale_price !== null ? (float)$this->sale_price : null,
            'effective_price'   => $this->effective_price,
            'on_sale'           => $this->on_sale,
            'image_url'         => $this->image_url,
            'is_featured'       => $this->is_featured,
            'categories'        => CategoryResource::collection($this->whenLoaded('categories')),
        ];
    }
}
