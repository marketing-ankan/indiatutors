<?php
namespace Database\Seeders;
use App\Models\Category;
use App\Models\Course;
use Illuminate\Database\Seeder;
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
            $course = Course::updateOrCreate(
                ['slug' => $slug],
                [
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
                ]
            );

            // Resolve hierarchical categories from "Parent > Child" chains
            $ids = [];
            foreach ($data['category_chains'] ?? [] as $chain) {
                $parentId = null; $path2 = '';
                foreach (array_map('trim', explode('>', $chain)) as $part) {
                    if ($part === '') continue;
                    $path2 = $path2 ? "$path2 > $part" : $part;
                    if (!isset($categoryCache[$path2])) {
                        $cat = Category::firstOrCreate(
                            ['name' => $part, 'parent_id' => $parentId],
                            ['slug' => Str::slug($part).($parentId ? '-'.$parentId : '')]
                        );
                        $categoryCache[$path2] = $cat->id;
                    }
                    $parentId = $categoryCache[$path2];
                }
                if ($parentId) $ids[$parentId] = true;
            }
            $course->categories()->sync(array_keys($ids));
        }

        // Drop categories that ended up empty (no courses and no children).
        Category::doesntHave('courses')->doesntHave('children')->delete();

        $this->command->info("Imported/updated ".count($sourceSlugs)." courses (pruned $pruned stale). Categories: ".Category::count());
    }
}
