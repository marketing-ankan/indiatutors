<?php
namespace Database\Seeders;
use App\Models\Post;
use Illuminate\Database\Seeder;

class PostSeeder extends Seeder {
    public function run(): void {
        // Live parity: indiatutorsonline.com has exactly one post — the WP
        // default "Hello world!" (April 16, 2026). Its permalink is top-level
        // (/hello-world/), which the SPA resolves via the 404 post fallback.
        $posts = [
            [
                'title'        => 'Hello world!',
                'slug'         => 'hello-world',
                'excerpt'      => 'Welcome to WordPress. This is your first post. Edit or delete it, then start writing!',
                'image_url'    => null,
                'author'       => 'Indiatutors Online',
                'published_at' => '2026-04-16 10:00:00',
                'body'         => '<p>Welcome to WordPress. This is your first post. Edit or delete it, then start writing!</p>',
            ],
        ];

        // Prune posts that are not in the source list (mirrors CourseSeeder).
        $slugs = array_column($posts, 'slug');
        $pruned = Post::whereNotIn('slug', $slugs)->count();
        if ($pruned > 0) Post::whereNotIn('slug', $slugs)->delete();

        foreach ($posts as $data) {
            Post::updateOrCreate(['slug' => $data['slug']], $data + ['is_published' => true]);
        }
        $this->command->info('Seeded '.count($posts)." blog post(s) (pruned {$pruned} stale).");
    }
}
