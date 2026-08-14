<?php
namespace Database\Seeders;
use App\Models\Post;
use App\Support\ConsoleOwned;
use App\Support\SeedFingerprint;
use Illuminate\Database\Seeder;

class PostSeeder extends Seeder {
    public function run(): void {
        $fp = SeedFingerprint::for('posts', [__FILE__]);
        if ($fp->isCurrent() && Post::exists()) {
            $this->command?->info('PostSeeder: unchanged — skipped.');
            return;
        }

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

        // Prune only posts this seeder owns.
        //
        // This used to be whereNotIn('slug', ['hello-world'])->delete(), which
        // deleted every post written in the Staff Console on the next cron pull —
        // silently, and re-armed by any edit to this file, since the fingerprint
        // above is a hash of it. The blog is an authored feature now, not a
        // one-row parity import.
        $slugs  = array_column($posts, 'slug');
        $stale  = ConsoleOwned::scopeSeederOwned(Post::whereNotIn('slug', $slugs));
        $pruned = $stale->count();
        if ($pruned > 0) $stale->delete();

        foreach ($posts as $data) {
            // A post someone has edited here belongs to them, even if it shares a
            // slug with the seeded one.
            if (ConsoleOwned::isOwned(Post::where('slug', $data['slug'])->first())) continue;

            Post::updateOrCreate(['slug' => $data['slug']], $data + ['is_published' => true]);
        }
        $fp->stamp();
        $this->command->info('Seeded '.count($posts)." blog post(s) (pruned {$pruned} stale).");
    }
}
