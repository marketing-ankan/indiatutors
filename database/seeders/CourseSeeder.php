<?php
namespace Database\Seeders;
use App\Models\Category;
use App\Models\Course;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CourseSeeder extends Seeder {
    public function run(): void {
        $csvPath = storage_path('app/imports/products.csv');
        if (!file_exists($csvPath)) {
            $this->command->error("CSV not found: $csvPath — skipping seeder.");
            return;
        }
        $handle = fopen($csvPath, 'r');
        $bom = fread($handle, 3);
        if ($bom !== "\xEF\xBB\xBF") rewind($handle);
        $headers = array_map('trim', fgetcsv($handle));
        $categoryCache = [];
        $created = 0;
        while (($row = fgetcsv($handle)) !== false) {
            if (count($row) < count($headers)) $row = array_pad($row, count($headers), '');
            $data = array_combine($headers, $row);
            if (empty($data['Name']) || (int)($data['Published'] ?? 0) !== 1) continue;
            $name = trim($data['Name']);
            $slug = Str::slug($name); $base = $slug; $n = 2;
            while (Course::where('slug', $slug)->exists()) $slug = $base.'-'.$n++;
            $reg  = (float)preg_replace('/[^\d.]/', '', $data['Regular price'] ?? '');
            $sale = (float)preg_replace('/[^\d.]/', '', $data['Sale price'] ?? '');
            $course = Course::create([
                'sku'               => trim($data['SKU'] ?? '') ?: null,
                'name'              => $name,
                'slug'              => $slug,
                'short_description' => trim($data['Short description'] ?? ''),
                'description'       => trim($data['Description'] ?? ''),
                'regular_price'     => $reg,
                'sale_price'        => $sale > 0 ? $sale : null,
                'image_url'         => trim(explode(',', $data['Images'] ?? '')[0]),
                'is_featured'       => (int)($data['Is featured?'] ?? 0) === 1,
                'is_published'      => true,
                'position'          => (int)($data['Position'] ?? 0),
            ]);
            $ids = [];
            foreach (explode(',', $data['Categories'] ?? '') as $chain) {
                $chain = trim($chain);
                if (!$chain || str_contains($chain, 'Legacy Assets')) continue;
                $parentId = null; $path = '';
                foreach (array_map('trim', explode('>', $chain)) as $part) {
                    if (!$part) continue;
                    $path = $path ? "$path > $part" : $part;
                    if (!isset($categoryCache[$path])) {
                        $cat = Category::firstOrCreate(
                            ['name' => $part, 'parent_id' => $parentId],
                            ['slug' => Str::slug($part).($parentId ? '-'.$parentId : '')]
                        );
                        $categoryCache[$path] = $cat->id;
                    }
                    $parentId = $categoryCache[$path];
                }
                if ($parentId) $ids[$parentId] = true;
            }
            if ($ids) $course->categories()->sync(array_keys($ids));
            $created++;
        }
        fclose($handle);
        $this->command->info("Imported $created courses. Categories: ".Category::count());
    }
}
