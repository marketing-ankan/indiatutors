<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * Blog posts from the Staff Console.
 *
 * The Post model, the public /posts endpoints and the /blog pages all already
 * existed — the only thing missing was any way to write one without a database
 * client, so the blog was effectively frozen at whatever the seeder inserted.
 *
 * Publishing is explicit and reversible: `is_published` plus a `published_at`
 * that is stamped on first publish and kept thereafter, so unpublishing to fix a
 * typo and republishing does not silently reorder the feed.
 */
class AdminPostController extends Controller
{
    /** Drafts included — an admin who cannot see a draft cannot publish it. */
    public function index()
    {
        return response()->json([
            'data' => Post::orderByDesc('published_at')->orderByDesc('id')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $this->rules($request);
        $data['slug'] = $this->uniqueSlug($data['title']);

        if (($data['is_published'] ?? false) && empty($data['published_at'])) {
            $data['published_at'] = now();
        }

        $post = Post::create($data);
        AuditLog::record('post_created', 'post', $post->id, $post->title, [
            'published' => (bool) $post->is_published,
        ]);

        return response()->json($post, 201);
    }

    public function update(Request $request, Post $post)
    {
        $data = $this->rules($request, $post);

        // Stamp the date the first time it goes live, and only then. Re-editing
        // a live post must not move it to the top of the feed.
        if (($data['is_published'] ?? $post->is_published) && !$post->published_at && empty($data['published_at'])) {
            $data['published_at'] = now();
        }

        $post->update($data);
        AuditLog::record('post_updated', 'post', $post->id, $post->title, array_keys($data));

        return response()->json($post->fresh());
    }

    public function destroy(Post $post)
    {
        AuditLog::record('post_deleted', 'post', $post->id, $post->title);
        $post->delete();
        return response()->json(['message' => 'Post deleted.']);
    }

    private function rules(Request $request, ?Post $post = null): array
    {
        $required = $post ? 'sometimes|required' : 'required';

        return $request->validate([
            'title'        => "{$required}|string|max:190",
            'excerpt'      => 'nullable|string|max:500',
            'body'         => 'nullable|string|max:200000',
            // string, not url: site images are relative (/build/images/...),
            // which is what the admin picker produces.
            'image_url'    => 'nullable|string|max:500',
            'author'       => 'nullable|string|max:120',
            'is_published' => 'nullable|boolean',
            'published_at' => 'nullable|date',
        ]);
    }

    /** Slugs are permanent once set — inbound links and shares point at them. */
    private function uniqueSlug(string $title): string
    {
        $base = Str::slug($title) ?: 'post';
        $slug = $base;
        $i = 2;
        while (Post::where('slug', $slug)->exists()) {
            $slug = $base . '-' . $i++;
        }
        return $slug;
    }
}
