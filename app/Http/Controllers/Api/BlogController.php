<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Http\Resources\PostResource;
use App\Models\Post;
use Illuminate\Http\Request;

class BlogController extends Controller {
    public function index(Request $request) {
        return PostResource::collection(
            Post::published()->orderByDesc('published_at')->orderByDesc('id')
                ->paginate(max(1, min((int) $request->integer('per_page', 9), 24)))
        );
    }

    public function show(string $slug) {
        $post = Post::where('slug', $slug)->published()->firstOrFail();
        return (new PostResource($post))->additional(['route' => 'api.posts.show']);
    }
}
