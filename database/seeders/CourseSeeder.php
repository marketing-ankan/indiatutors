<?php
namespace Database\Seeders;
use App\Models\Category;
use App\Models\Course;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class CourseSeeder extends Seeder {
    public function run(): void {
        $path = __DIR__.'/data/courses.json';
        if (!file_exists($path)) {
            $this->command->error("Course data not found: $path — skipping seeder.");
            return;
        }
        $courses = json_decode(file_get_contents($path), true);
        if (!is_array($courses)) {
            $this->command->error('Could not parse courses.json — skipping seeder.');
            return;
        }

        // Self-heal the curriculum_variants column. On Hostinger the deploy's
        // `migrate` step is flaky, so the column can be missing even though the
        // migration is committed — and then EVERY upsert below would throw
        // "Unknown column", leaving the whole catalog without curriculum. Create
        // it here (idempotent) so the seeder is self-sufficient; if creation
        // fails for any reason, $hasVariants stays false and we simply skip
        // writing that one field (CBSE curriculum still seeds).
        $hasVariants = Schema::hasColumn('courses', 'curriculum_variants');
        if (!$hasVariants) {
            try {
                Schema::table('courses', fn (Blueprint $t) => $t->json('curriculum_variants')->nullable()->after('curriculum'));
                $hasVariants = true;
            } catch (\Throwable $e) {
                $this->command->warn('curriculum_variants column missing and could not be created; skipping variants.');
            }
        }

        // Slugs present in the source (WP post_name).
        $sourceSlugs = array_map(fn ($d) => ($d['slug'] ?? '') ?: Str::slug($d['name']), $courses);

        // Prune stale courses FIRST so old rows release their unique keys (sku)
        // before we upsert. Non-destructive: demo_requests.course_id is
        // nullOnDelete, so any linked requests are preserved.
        $pruned = Course::whereNotIn('slug', $sourceSlugs)->count();
        if ($pruned > 0) Course::whereNotIn('slug', $sourceSlugs)->delete();

        $categoryCache = [];
        foreach ($courses as $data) {
            $slug = ($data['slug'] ?? '') ?: Str::slug($data['name']);
            $attrs = [
                'sku'               => $data['sku'] ?? null,
                'name'              => $data['name'],
                'subtitle'          => $data['subtitle'] ?? null,
                'short_description' => $data['short_description'] ?? '',
                'description'       => $data['description'] ?? '',
                'age'               => $data['age'] ?? null,
                'pills'             => $data['pills'] ?? [],
                'curriculum'        => $data['curriculum'] ?? [],
                'regular_price'     => $data['regular_price'] ?? 0,
                'sale_price'        => ($data['sale_price'] ?? null) ?: null,
                'image_url'         => $data['image_url'] ?: null,
                'is_featured'       => (bool)($data['is_featured'] ?? false),
                'is_published'      => true,
                'position'          => (int)($data['position'] ?? 0),
            ];
            // Only write curriculum_variants when the column is present (see the
            // self-heal above) so a missing column can never abort the seed.
            if ($hasVariants) $attrs['curriculum_variants'] = $data['curriculum_variants'] ?? null;
            $course = Course::updateOrCreate(['slug' => $slug], $attrs);

            // Resolve hierarchical categories from "Parent > Child" chains
            $ids = [];
            foreach ($data['category_chains'] ?? [] as $chain) {
                $parentId = null; $path2 = '';
                foreach (array_map('trim', explode('>', $chain)) as $part) {
                    if ($part === '') continue;
                    $path2 = $path2 ? "$path2 > $part" : $part;
                    if (!isset($categoryCache[$path2])) {
                        // Match the live WordPress slugs exactly: sanitize_title turns
                        // "/" into "-" (Math SAT/PSAT -> math-sat-psat), and child
                        // slugs carry no parent suffix. Fall back to a -{parentId}
                        // suffix only on a genuine collision (same subject name under
                        // two parents, e.g. Elementary > English vs High School > English —
                        // slug is unique so the second create must pre-resolve it).
                        $desired = Str::slug(str_replace('/', '-', $part));
                        $cat = Category::where('name', $part)->where('parent_id', $parentId)->first();
                        if (!$cat) {
                            $taken = Category::where('slug', $desired)->exists();
                            $cat = Category::create([
                                'name'      => $part,
                                'parent_id' => $parentId,
                                'slug'      => $taken ? $desired.'-'.($parentId ?? 0) : $desired,
                            ]);
                        } elseif ($cat->slug !== $desired) {
                            $taken = Category::where('slug', $desired)->where('id', '!=', $cat->id)->exists();
                            if (!$taken) $cat->update(['slug' => $desired]);
                        }
                        $categoryCache[$path2] = $cat->id;
                    }
                    $parentId = $categoryCache[$path2];
                }
                if ($parentId) $ids[$parentId] = true;
            }
            $course->categories()->sync(array_keys($ids));
        }

        // Drop categories that ended up empty (no courses and no children).
        // Loop so a parent whose children were all just pruned (e.g. the removed
        // "AP Courses" branch) also clears in the same run — bottom-up to stable.
        do { $gone = Category::doesntHave('courses')->doesntHave('children')->delete(); } while ($gone > 0);

        $this->command->info("Imported/updated ".count($sourceSlugs)." courses (pruned $pruned stale). Categories: ".Category::count());
    }
}
