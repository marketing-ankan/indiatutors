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
            // RAW, not the accessor. Course::getImageUrlAttribute appends
            // ?v=<filemtime> for cache-busting; the console's edit form loads
            // this value and posts it straight back, which stored the decorated
            // path in the column. is_file() then fails against a path carrying a
            // query string, so cache-busting died for that course and the image
            // picker's "currently selected" highlight stopped matching.
            'image_url'     => $this->getRawOriginal('image_url'),
            // Every field the console's edit form can write must also be read
            // back here. This one was missing, so the form loaded it as "" and
            // an ordinary "Save changes" silently wiped the course's
            // description — no error, no warning, the text simply gone.
            'short_description' => $this->short_description,
            'subtitle'          => $this->subtitle,
            'age'               => $this->age,

            // Group-class fields, edited in the same form.
            'is_group'              => (bool) $this->is_group,
            'group_about'           => $this->group_about,
            'group_highlights'      => $this->group_highlights ?? [],
            'group_age_range'       => $this->group_age_range,
            'group_duration_weeks'  => $this->group_duration_weeks,
            'group_batches_done'    => $this->group_batches_done,
            'group_ongoing_batches' => $this->group_ongoing_batches,
            'batches'               => $this->whenLoaded('batches', fn () => $this->batches->map->only(
                ['id', 'name', 'schedule_days', 'schedule_time', 'timezone', 'seats_total', 'position']
            )),
            'categories'    => $this->whenLoaded('categories', fn () => $this->categories->map->only(['id', 'name'])),
            'reviews_count' => $this->whenCounted('reviews'),
            'created_at'    => optional($this->created_at)->toDateString(),
        ];
    }
}
