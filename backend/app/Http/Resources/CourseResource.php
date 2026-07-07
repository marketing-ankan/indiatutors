<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CourseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                => $this->id,
            'sku'               => $this->sku,
            'name'              => $this->name,
            'slug'              => $this->slug,
            'short_description' => $this->short_description,
            'description'       => $this->when($request->routeIs('courses.show'), $this->description),
            'regular_price'     => (float) $this->regular_price,
            'sale_price'        => $this->sale_price !== null ? (float) $this->sale_price : null,
            'effective_price'   => $this->effective_price,
            'on_sale'           => $this->on_sale,
            'image_url'         => $this->image_url,
            'is_featured'       => $this->is_featured,
            'categories'        => CategoryResource::collection($this->whenLoaded('categories')),
        ];
    }
}
