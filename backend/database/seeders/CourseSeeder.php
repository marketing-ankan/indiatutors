<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Course;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Imports products + categories from the WooCommerce CSV export at:
 *   storage/app/imports/products.csv
 *
 * Categories in the CSV are comma-separated and nested with " > ":
 *   e.g. "Academics — Elementary & Middle School > Mathematics"
 * This seeder builds the parent → child tree correctly and attaches
 * each course to every leaf category it's tagged with.
 */
class CourseSeeder extends Seeder
{
    public function run(): void
    {
        $csvPath = storage_path('app/imports/products.csv');

        if (! file_exists($csvPath)) {
            $this->command->error("CSV not found at: {$csvPath}");
            return;
        }

        $handle = fopen($csvPath, 'r');
        // Strip UTF-8 BOM if present
        $bom = fread($handle, 3);
        if ($bom !== "\xEF\xBB\xBF") {
            rewind($handle);
        }

        $headers = fgetcsv($handle);
        $headers = array_map(fn ($h) => trim($h), $headers);

        $categoryCache = []; // "Parent > Child" => Category id

        $created = 0;
        $skipped = 0;

        while (($row = fgetcsv($handle)) !== false) {
            if (count($row) < count($headers)) {
                $row = array_pad($row, count($headers), '');
            }
            $data = array_combine($headers, $row);

            if (empty($data['Name']) || (int) ($data['Published'] ?? 0) !== 1) {
                $skipped++;
                continue;
            }

            $name = trim($data['Name']);
            $slug = Str::slug($name);
            // Ensure slug uniqueness
            $base = $slug;
            $n = 2;
            while (Course::where('slug', $slug)->exists()) {
                $slug = $base.'-'.$n++;
            }

            $regular = $this->parseMoney($data['Regular price'] ?? '');
            $sale    = $this->parseMoney($data['Sale price'] ?? '');

            $course = Course::create([
                'sku'               => $data['SKU'] ?? null,
                'name'              => $name,
                'slug'              => $slug,
                'short_description' => trim($data['Short description'] ?? ''),
                'description'       => trim($data['Description'] ?? ''),
                'regular_price'     => $regular,
                'sale_price'        => $sale > 0 ? $sale : null,
                'image_url'         => $this->firstImage($data['Images'] ?? ''),
                'is_featured'       => (int) ($data['Is featured?'] ?? 0) === 1,
                'is_published'      => true,
                'position'          => (int) ($data['Position'] ?? 0),
            ]);

            // Categories: comma-separated top level, " > " for hierarchy
            $catField = $data['Categories'] ?? '';
            if ($catField !== '') {
                $ids = [];
                foreach (explode(',', $catField) as $chain) {
                    $chain = trim($chain);
                    if ($chain === '' || stripos($chain, 'Legacy Assets') !== false) {
                        continue;
                    }
                    $id = $this->resolveCategoryChain($chain, $categoryCache);
                    if ($id) {
                        $ids[$id] = true;
                    }
                }
                if (! empty($ids)) {
                    $course->categories()->sync(array_keys($ids));
                }
            }

            $created++;
        }

        fclose($handle);

        $this->command->info("Imported {$created} courses (skipped {$skipped}).");
        $this->command->info('Categories in tree: '.Category::count());
    }

    private function parseMoney(string $v): float
    {
        $v = trim($v);
        if ($v === '') return 0.0;
        return (float) preg_replace('/[^\d.]/', '', $v);
    }

    private function firstImage(string $images): ?string
    {
        $first = trim(explode(',', $images)[0] ?? '');
        return $first === '' ? null : $first;
    }

    /**
     * "Parent > Child > Grandchild" → id of the deepest leaf, creating any
     * missing ancestors on the way. Cached so we don't re-query.
     */
    private function resolveCategoryChain(string $chain, array &$cache): ?int
    {
        $parts = array_map('trim', explode('>', $chain));
        $parts = array_filter($parts, fn ($p) => $p !== '');
        if (empty($parts)) return null;

        $parentId = null;
        $path = '';

        foreach ($parts as $name) {
            $path = $path === '' ? $name : "$path > $name";
            if (isset($cache[$path])) {
                $parentId = $cache[$path];
                continue;
            }

            $cat = Category::firstOrCreate(
                [
                    'name'      => $name,
                    'parent_id' => $parentId,
                ],
                [
                    'slug' => Str::slug($name).($parentId ? '-'.$parentId : ''),
                ]
            );

            $cache[$path] = $cat->id;
            $parentId = $cat->id;
        }

        return $parentId;
    }
}
