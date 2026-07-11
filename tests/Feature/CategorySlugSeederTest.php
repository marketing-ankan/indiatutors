<?php
namespace Tests\Feature;

use App\Models\Category;
use Database\Seeders\CourseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategorySlugSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_seeder_produces_the_live_wordpress_slugs(): void
    {
        $this->seed(CourseSeeder::class);

        // Child categories carry clean WP slugs — no parent-id suffixes.
        foreach (['abacus', 'ai-ml', 'ap-biology', 'algebra', 'animation'] as $slug) {
            $this->assertNotNull(Category::where('slug', $slug)->first(), "missing clean slug: $slug");
        }
        $this->assertNull(Category::where('slug', 'like', 'ai-ml-%')->first(), 'old suffixed slug survived');

        // WP turns "/" into "-": Math SAT/PSAT -> math-sat-psat.
        foreach (['math-sat-psat', 'english-sat-psat', 'digital-sat-psat-math'] as $slug) {
            $this->assertNotNull(Category::where('slug', $slug)->first(), "missing slash-derived slug: $slug");
        }

        // Full taxonomy present and slugs unique.
        $this->assertSame(112, Category::count());
        $this->assertSame(112, Category::distinct('slug')->count('slug'));
    }

    public function test_reseeding_fixes_old_suffixed_slugs_in_place(): void
    {
        $this->seed(CourseSeeder::class);

        // Simulate the production DB state: children carry -{parentId} suffixes.
        $cat = Category::where('slug', 'ai-ml')->firstOrFail();
        $cat->update(['slug' => 'ai-ml-'.$cat->parent_id]);
        $id = $cat->id;
        $courseCount = $cat->courses()->count();
        $this->assertGreaterThan(0, $courseCount);

        $this->seed(CourseSeeder::class);

        $fixed = Category::find($id);
        $this->assertNotNull($fixed, 'category row was replaced instead of updated');
        $this->assertSame('ai-ml', $fixed->slug);
        $this->assertSame($courseCount, $fixed->courses()->count(), 'course links lost during reseed');
    }
}
