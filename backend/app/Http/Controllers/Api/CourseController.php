<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CourseResource;
use App\Models\Course;
use Illuminate\Http\Request;

class CourseController extends Controller
{
    public function index(Request $request)
    {
        $query = Course::query()->published()->with('categories');

        // Filter by category slug (matches the category or any of its descendants)
        if ($slug = $request->string('category')->toString()) {
            $ids = \App\Models\Category::where('slug', $slug)->pluck('id')->all();
            if (! empty($ids)) {
                // Include descendants
                $ids = array_merge($ids, \App\Models\Category::whereIn('parent_id', $ids)->pluck('id')->all());
                $query->whereHas('categories', fn ($q) => $q->whereIn('categories.id', $ids));
            }
        }

        // Search
        if ($q = $request->string('search')->toString()) {
            $query->where(function ($sub) use ($q) {
                $sub->where('name', 'like', "%{$q}%")
                    ->orWhere('short_description', 'like', "%{$q}%");
            });
        }

        // Featured only
        if ($request->boolean('featured')) {
            $query->featured();
        }

        // Sort
        $sort = $request->string('sort', 'popular')->toString();
        match ($sort) {
            'price_asc'  => $query->orderBy('regular_price'),
            'price_desc' => $query->orderByDesc('regular_price'),
            'name'       => $query->orderBy('name'),
            'newest'     => $query->orderByDesc('id'),
            default      => $query->orderByDesc('is_featured')->orderBy('position')->orderBy('name'),
        };

        $perPage = min((int) $request->integer('per_page', 12), 48);

        return CourseResource::collection($query->paginate($perPage));
    }

    public function show(string $slug, Request $request)
    {
        $course = Course::where('slug', $slug)->published()->with('categories')->firstOrFail();
        // Tag the route for the resource to include full description
        $request->route()?->name('courses.show');
        return new CourseResource($course);
    }
}
