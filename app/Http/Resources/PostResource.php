<?php
namespace App\Http\Resources;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PostResource extends JsonResource {
    public function toArray(Request $request): array {
        return [
            'id'           => $this->id,
            'title'        => $this->title,
            'slug'         => $this->slug,
            'excerpt'      => $this->excerpt,
            'image_url'    => $this->image_url,
            'author'       => $this->author,
            'published_at' => optional($this->published_at)->toDateString(),
            'body'         => $this->when($request->routeIs('api.posts.show'), $this->body),
        ];
    }
}
