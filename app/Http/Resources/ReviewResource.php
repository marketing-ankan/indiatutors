<?php
namespace App\Http\Resources;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReviewResource extends JsonResource {
    public function toArray(Request $request): array {
        $isAdmin = (bool) $request->user()?->isAdmin();

        return [
            'id'          => $this->id,
            'author_name' => $this->author_name,
            // Reviewer emails are collected for follow-up, never published.
            'author_email'=> $this->when($isAdmin, $this->author_email),
            'rating'      => (int) $this->rating,
            'body'        => $this->body,
            'status'      => $this->when($isAdmin, $this->status),
            'subject'     => [
                'kind' => $this->video_course_id ? 'video' : 'course',
                'name' => $this->whenLoaded('course', fn () => $this->course?->name)
                    ?: $this->whenLoaded('videoCourse', fn () => $this->videoCourse?->title),
                'slug' => $this->whenLoaded('course', fn () => $this->course?->slug)
                    ?: $this->whenLoaded('videoCourse', fn () => $this->videoCourse?->slug),
            ],
            'created_at'  => optional($this->created_at)->toDateString(),
        ];
    }
}
