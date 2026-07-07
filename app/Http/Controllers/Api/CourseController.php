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
                $ids = array_merge([$cat->id], Category::where('parent_id', $cat->id)->pluck('id')->all());
                $query->whereHas('categories', fn($q) => $q->whereIn('categories.id', $ids));
            }
        }

        if ($q = $request->string('search')->toString()) {
            $query->where(fn($s) => $s->where('name','like',"%$q%")->orWhere('short_description','like',"%$q%"));
        }

        if ($request->boolean('featured')) $query->featured();

        match($request->string('sort','popular')->toString()) {
            'price_asc'  => $query->orderBy('regular_price'),
            'price_desc' => $query->orderByDesc('regular_price'),
            'name'       => $query->orderBy('name'),
            'newest'     => $query->orderByDesc('id'),
            default      => $query->orderByDesc('is_featured')->orderBy('position')->orderBy('name'),
        };

        return CourseResource::collection($query->paginate(min((int)$request->integer('per_page',12),48)));
    }

    public function show(string $slug) {
        $course = Course::where('slug',$slug)->published()->with('categories')->firstOrFail();
        return (new CourseResource($course))->additional(['route' => 'api.courses.show']);
    }
}
