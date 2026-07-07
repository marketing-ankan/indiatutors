<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Models\Category;

class CategoryController extends Controller {
    public function index() {
        return CategoryResource::collection(
            Category::withCount('courses')->orderBy('position')->orderBy('name')->get()
        );
    }

    public function tree() {
        $roots = Category::roots()
            ->with(['children' => fn($q) => $q->with('children')])
            ->withCount('courses')
            ->orderBy('position')->orderBy('name')->get();
        return CategoryResource::collection($roots);
    }

    public function show(string $slug) {
        return new CategoryResource(Category::where('slug', $slug)->firstOrFail());
    }
}
