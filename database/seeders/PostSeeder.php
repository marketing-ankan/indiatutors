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

        // Empty on purpose.
        //
        // This used to seed the WordPress default — "Hello world! Welcome to
        // WordPress. This is your first post." — because the goal then was an
        // exact clone of the WP site, and that was its only post. That goal is
        // met and the site is now the business's own: a live tutoring company
        // whose entire blog reads "Welcome to WordPress" is worse than a blog
        // with nothing in it, and staff can write a real post in the console.
        //
        // The prune below removes it on the next deploy. Anything written in the
        // console is marked console-owned and is NOT touched.
        $posts = [];

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
