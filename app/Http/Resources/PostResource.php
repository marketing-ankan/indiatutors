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
            // Always included: the live blog index renders full post content
            // (WP posts page), so the list endpoint needs the body too.
            'body'         => $this->body,
        ];
    }
}
