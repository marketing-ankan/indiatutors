<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AdminCourseResource;
use App\Models\AuditLog;
use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

// Catalogue management. Note the absence of ->published(): the public
// CourseController hard-filters drafts, and an admin who cannot see a draft
// cannot publish it.
class AdminCourseController extends Controller
{
    public function index(Request $request)
    {
        $q = Course::query()
            ->with(['categories:id,name', 'batches'])
            ->withCount('reviews')
            ->orderBy('position')->orderBy('name');

        if ($s = trim($request->string('q')->toString())) {
            $q->where(fn ($w) => $w->where('name', 'like', "%{$s}%")->orWhere('sku', 'like', "%{$s}%"));
        }
        if ($request->filled('published')) {
            $q->where('is_published', $request->boolean('published'));
        }
        if ($cat = $request->integer('category')) {
            $q->whereHas('categories', fn ($c) => $c->where('categories.id', $cat));
        }

        return AdminCourseResource::collection($q->paginate(20));
    }

    public function store(Request $request)
    {
        $data = $this->rules($request);
        $data['slug'] = $this->uniqueSlug($data['name']);

        $course = Course::create($data);
        if ($request->filled('category_ids')) $course->categories()->sync($request->input('category_ids'));

        AuditLog::record('course_added', 'course', $course->id, $course->name);

        return (new AdminCourseResource($course->load(['categories:id,name','batches'])->loadCount('reviews')))
            ->response()->setStatusCode(201);
    }

    public function update(Request $request, Course $course)
    {
        $before = $course->only(['regular_price', 'sale_price', 'is_published']);
        $course->update($this->rules($request, $course));
        if ($request->has('category_ids')) $course->categories()->sync($request->input('category_ids', []));

        AuditLog::record('course_updated', 'course', $course->id, $course->name, [
            'from' => $before,
            'to'   => $course->only(['regular_price', 'sale_price', 'is_published']),
        ]);

        return new AdminCourseResource($course->fresh()->load(['categories:id,name','batches'])->loadCount('reviews'));
    }

    public function destroy(Course $course)
    {
        $label = $course->name;
        $id    = $course->id;
        $course->delete();
        AuditLog::record('course_deleted', 'course', $id, $label);

        return response()->json(['message' => "“{$label}” deleted."]);
    }

    /** Partial on update so the console's inline price/status edit can send two fields. */
    private function rules(Request $request, ?Course $course = null): array
    {
        $required = $course ? 'sometimes|required' : 'required';

        return $request->validate([
            'name'              => "{$required}|string|max:190",
            'sku'               => 'nullable|string|max:120',
            'subtitle'          => 'nullable|string|max:255',
            'short_description' => 'nullable|string|max:1000',
            'description'       => 'nullable|string',
            'age'               => 'nullable|string|max:60',
            'regular_price'     => 'nullable|numeric|min:0|max:9999999',
            'sale_price'        => 'nullable|numeric|min:0|max:9999999',
            'image_url'         => 'nullable|string|max:500',
            'is_published'      => 'nullable|boolean',
            'is_featured'       => 'nullable|boolean',
            'position'          => 'nullable|integer|min:0|max:9999',
            'category_ids'      => 'nullable|array',
            'category_ids.*'    => 'integer|exists:categories,id',

            // Group-class fields. These drive /group-classes, which had no
            // backing store at all before — it read a committed JSON file.
            'is_group'              => 'nullable|boolean',
            'group_about'           => 'nullable|string|max:2000',
            'group_highlights'      => 'nullable|array',
            'group_highlights.*'    => 'string|max:200',
            'group_age_range'       => 'nullable|string|max:40',
            'group_duration_weeks'  => 'nullable|integer|min:1|max:104',
            // Nullable on purpose: blank hides the chip. The figures these
            // replace were invented and frozen, so an empty field is the honest
            // default and a typed one is the owner's own claim.
            'group_batches_done'    => 'nullable|integer|min:0|max:100000',
            'group_ongoing_batches' => 'nullable|integer|min:0|max:100000',
        ]);
    }

    private function uniqueSlug(string $name): string
    {
        $base = Str::slug($name) ?: 'course';
        $slug = $base;
        $i = 2;
        while (Course::where('slug', $slug)->exists()) $slug = $base . '-' . $i++;

        return $slug;
    }
}
