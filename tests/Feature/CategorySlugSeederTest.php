<?php
namespace Tests\Feature;

use App\Models\Category;
use Database\Seeders\CourseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategorySlugSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_seeder_produces_clean_category_slugs(): void
    {
        $this->seed(CourseSeeder::class);

        // Child categories carry clean slugs — no parent-id suffixes.
        foreach (['abacus', 'ai-ml', 'animation', 'accountancy', 'political-science'] as $slug) {
            $this->assertNotNull(Category::where('slug', $slug)->first(), "missing clean slug: $slug");
        }
        $this->assertNull(Category::where('slug', 'like', 'ai-ml-%')->first(), 'old suffixed slug survived');

        // Ampersands and punctuation are dropped rather than left as separators.
        foreach (['roblox-minecraft', 'arts-painting', 'academics-primary-middle-classes-1-8'] as $slug) {
            $this->assertNotNull(Category::where('slug', $slug)->first(), "missing punctuation-derived slug: $slug");
        }

        // The US-curriculum branches were removed in the India-localisation pass
        // and must not come back through the seeder.
        foreach (['ap-biology', 'algebra', 'honors', 'math-sat-psat', 'standardized-tests', 'social-studies'] as $slug) {
            $this->assertNull(Category::where('slug', $slug)->first(), "retired US category reappeared: $slug");
        }

        // Full taxonomy present and slugs unique.
        $count = Category::count();
        $this->assertSame($count, Category::distinct('slug')->count('slug'), 'duplicate category slugs');
        $this->assertGreaterThan(100, $count);
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
