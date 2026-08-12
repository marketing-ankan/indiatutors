<?php
namespace Database\Seeders;
use App\Models\Category;
use App\Models\Course;
use App\Support\ConsoleOwned;
use App\Support\SeedFingerprint;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class CourseSeeder extends Seeder {
    public function run(): void {
        $path = __DIR__.'/data/courses.json';

        // The expensive one: 134 courses, 112 categories and every curriculum
        // row, rewritten on every deploy even when courses.json has not moved.
        // That is the work most likely to be getting the cron job killed before
        // it copies the new front-end build to the web root. Skip when the
        // source is byte-identical AND the catalogue is actually present — a
        // matching fingerprint over an empty table means the DB was wiped.
        $fp = SeedFingerprint::for('courses', [$path, __FILE__]);
        if ($fp->isCurrent() && Course::exists()) {
            $this->command?->info('CourseSeeder: courses.json unchanged — skipped ('.Course::count().' courses already seeded).');
            return;
        }

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
        //
        // Restricted to rows the console has never touched: a course CREATED in
        // the Staff Console has no slug in courses.json, so this used to delete
        // it outright on the next deploy.
        $stale  = ConsoleOwned::scopeSeederOwned(Course::whereNotIn('slug', $sourceSlugs));
        $pruned = $stale->count();
        if ($pruned > 0) $stale->delete();

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

            $course = Course::where('slug', $slug)->first();

            // Once someone edits a course in the Staff Console it is theirs. This
            // block used to overwrite name, prices, description, image, position
            // and force is_published => true, so a price edit silently reverted
            // on the next deploy and an unpublished course republished itself.
            // Category links are still synced below: those ARE console-editable,
            // but they are additive here and re-syncing them costs nothing.
            if (!ConsoleOwned::isOwned($course)) {
                $course = Course::updateOrCreate(['slug' => $slug], $attrs);
            }

            // Resolve hierarchical categories from "Parent > Child" chains
            $ids = [];
            foreach ($data['category_chains'] ?? [] as $chain) {
                $parentId = null; $path2 = '';
                foreach (array_map('trim', explode('>', $chain)) as $part) {
                    if ($part === '') continue;
                    $path2 = $path2 ? "$path2 > $part" : $part;
                    if (!isset($categoryCache[$path2])) {
                        // Match the live WordPress slugs exactly: sanitize_title turns
                        // "/" into "-" (Vocal Music > Carnatic -> carnatic), and child
                        // slugs carry no parent suffix. Fall back to a -{parentId}
                        // suffix only on a genuine collision (same subject name under
                        // two parents, e.g. Primary & Middle > English vs Secondary &
                        // Senior Secondary > English — slug is unique so the second
                        // create must pre-resolve it).
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
        // "Standardized Tests" branch) also clears in the same run — bottom-up to stable.
        do { $gone = Category::doesntHave('courses')->doesntHave('children')->delete(); } while ($gone > 0);

        $fp->stamp();   // only after a full successful pass
        $this->command->info("Imported/updated ".count($sourceSlugs)." courses (pruned $pruned stale). Categories: ".Category::count());
    }
}
