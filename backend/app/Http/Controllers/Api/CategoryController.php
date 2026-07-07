<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Models\Category;

class CategoryController extends Controller
{
    /** Flat list with course counts (for filters/menus) */
    public function index()
    {
        $categories = Category::withCount('courses')
            ->orderBy('position')
            ->orderBy('name')
            ->get();

        return CategoryResource::collection($categories);
    }

    /** Nested tree (roots with children) */
    public function tree()
    {
        $roots = Category::roots()
            ->with(['children' => function ($q) {
                $q->with('children'); // 2 levels deep is enough for this catalog
            }])
            ->withCount('courses')
            ->orderBy('position')
            ->orderBy('name')
            ->get();

        return CategoryResource::collection($roots);
    }

    public function show(string $slug)
    {
        $category = Category::where('slug', $slug)->firstOrFail();
        return new CategoryResource($category);
    }
}
