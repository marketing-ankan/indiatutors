<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Http\Resources\CourseResource;
use App\Models\Category;
use App\Models\Course;
use Illuminate\Http\Request;

class CourseController extends Controller {
    public function index(Request $request) {
        $query = Course::query()->published()->with('categories');

        if ($slug = $request->string('category')->toString()) {
            $cat = Category::where('slug', $slug)->first();
            if ($cat) {
                // Include the category and ALL descendants (any depth), so a parent
                // category surfaces every course in its subtree — matching WooCommerce.
                $ids = $this->descendantIds($cat->id);
                $query->whereHas('categories', fn($q) => $q->whereIn('categories.id', $ids));
            } else {
                // Unknown category slug -> no matches (rather than silently returning all).
                $query->whereRaw('1 = 0');
            }
        }

        if ($q = $request->string('search')->toString()) {
            $query->where(fn($s) => $s->where('name','like',"%$q%")->orWhere('short_description','like',"%$q%"));
        }

        if ($request->boolean('featured')) $query->featured();

        // Effective price = sale price when on sale, else regular price.
        $effective = 'COALESCE(NULLIF(sale_price, 0), regular_price)';
        if (($min = (int) $request->integer('price_min')) > 0) $query->whereRaw("$effective >= ?", [$min]);
        if (($max = (int) $request->integer('price_max')) > 0) $query->whereRaw("$effective <= ?", [$max]);

        // Sort by the effective price so the ordering matches the prices shown.
        match($request->string('sort','popular')->toString()) {
            'price_asc'  => $query->orderByRaw("$effective asc"),
            'price_desc' => $query->orderByRaw("$effective desc"),
            'name'       => $query->orderBy('name'),
            'newest'     => $query->orderByDesc('id'),
            default      => $query->orderByDesc('is_featured')->orderBy('position')->orderBy('name'),
        };

        $perPage = max(1, min((int) $request->integer('per_page', 12), 48));
        return CourseResource::collection($query->paginate($perPage));
    }

    /** Category id + all descendant ids (breadth-first, cycle-safe). */
    private function descendantIds(int $rootId): array {
        $all = [$rootId];
        $frontier = [$rootId];
        while ($frontier) {
            $children = Category::whereIn('parent_id', $frontier)
                ->whereNotIn('id', $all)->pluck('id')->all();
            if (!$children) break;
            $all = array_merge($all, $children);
            $frontier = $children;
        }
        return $all;
    }

    public function show(string $slug) {
        $course = Course::where('slug',$slug)->published()->with('categories')->firstOrFail();
        return (new CourseResource($course))->additional(['route' => 'api.courses.show']);
    }
}
