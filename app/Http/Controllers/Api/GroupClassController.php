<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseBatch;
use Illuminate\Http\Request;

/**
 * /group-classes, served from the database instead of a committed JSON file.
 *
 * Group classes ARE courses — same slugs, same prices, same categories — so they
 * live on the courses table behind an `is_group` flag rather than in a parallel
 * catalogue the console would have to maintain twice.
 *
 * The payload carries only what the page draws. Notably absent: any "batches
 * done" or "students enrolled" figure that has not been typed by the owner. The
 * numbers this replaces were invented, so a null here renders no chip at all
 * rather than a fabricated one.
 */
class GroupClassController extends Controller
{
    public function index()
    {
        $courses = Course::group()->published()
            ->with(['batches', 'categories:id,name,slug,parent_id'])
            ->orderBy('position')->orderBy('name')
            ->get();

        $cards = $courses->map(fn ($c) => $this->cardPayload($c))->values();

        // The sidebar, built from the category each card actually resolves to.
        //
        // Deliberately not "every category on these courses" (24 entries — the
        // leaves: Python, Chess, Tamil) and not "every root category" either:
        // some leaves are stored with parent_id NULL, so "Python" showed up as a
        // filter that matched nothing. Deriving from the resolved card value
        // makes an empty filter impossible by construction.
        $categories = $cards
            ->filter(fn ($c) => $c['category_key'])
            ->map(fn ($c) => ['key' => $c['category_key'], 'label' => $c['category_label']])
            ->unique('key')->sortBy('label')->values();

        return response()->json([
            'data'       => $cards,
            'categories' => $categories,
        ]);
    }

    private function cardPayload(Course $c): array
    {
        $price = (float) ($c->sale_price ?: $c->regular_price);
        $was   = $c->on_sale ? (float) $c->regular_price : null;

        return [
            'id'             => $c->id,
            'slug'           => $c->slug,
            'title'          => $c->name,
            // The root category, to match the sidebar keys above — first() would
            // often return the leaf ("Python") and never match the filter.
            'category_key'   => $c->categories->whereNull('parent_id')->first()?->slug,
            'category_label' => $c->categories->whereNull('parent_id')->first()?->name,
            'about'          => $c->group_about ?: $c->short_description,
            'highlights'     => $c->group_highlights ?: [],
            'age_range'      => $c->group_age_range,
            'duration_weeks' => $c->group_duration_weeks,
            // Null unless the owner has entered a real figure.
            'batches_done'   => $c->group_batches_done,
            'ongoing'        => $c->group_ongoing_batches,
            'price'          => $price,
            // Only a genuine sale produces a strike-through, so the discount is
            // computed from real numbers instead of a hardcoded "40% OFF".
            'compare_at'     => $was,
            'discount_pct'   => $was && $was > $price ? (int) round(100 - ($price / $was * 100)) : null,
            'batches'        => $c->batches->map(fn (CourseBatch $b) => [
                'id'       => $b->id,
                'name'     => $b->name,
                'days'     => $b->schedule_days,
                'time'     => $b->schedule_time,
                'timezone' => $b->timezone,
                'seats'    => $b->seats_total,
            ])->values(),
        ];
    }

    /* ------------------------------------------------------------------ admin */

    public function storeBatch(Request $request, Course $course)
    {
        $data = $this->batchRules($request);
        $data['position'] ??= ((int) $course->batches()->max('position')) + 1;
        return response()->json($course->batches()->create($data), 201);
    }

    public function updateBatch(Request $request, Course $course, CourseBatch $batch)
    {
        abort_unless($batch->course_id === $course->id, 404);
        $batch->update($this->batchRules($request, true));
        return response()->json($batch->fresh());
    }

    public function destroyBatch(Course $course, CourseBatch $batch)
    {
        abort_unless($batch->course_id === $course->id, 404);
        $batch->delete();
        return response()->json(['message' => 'Batch deleted.']);
    }

    private function batchRules(Request $request, bool $partial = false): array
    {
        return $request->validate([
            'name'          => ($partial ? 'sometimes|' : '') . 'required|string|max:60',
            'schedule_days' => 'nullable|string|max:60',
            'schedule_time' => 'nullable|string|max:60',
            'timezone'      => 'nullable|string|max:20',
            'seats_total'   => 'nullable|integer|min:0|max:1000',
            'position'      => 'nullable|integer|min:0',
        ]);
    }
}
