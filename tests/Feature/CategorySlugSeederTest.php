<?php
namespace Tests\Feature;

use App\Models\Category;
use App\Support\SeedFingerprint;
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

        // A REPAIR re-seed. courses.json has not changed, so the fingerprint
        // gate would skip an import — drift is invisible to a content hash.
        // Repair callers say so explicitly; see SeedFingerprint::bypass.
        SeedFingerprint::bypass(fn () => $this->seed(CourseSeeder::class));

        $fixed = Category::find($id);
        $this->assertNotNull($fixed, 'category row was replaced instead of updated');
        $this->assertSame('ai-ml', $fixed->slug);
        $this->assertSame($courseCount, $fixed->courses()->count(), 'course links lost during reseed');
    }

    /**
     * The other half of that bargain: an ordinary re-run must NOT redo the work.
     * Rewriting 134 courses on every deploy is what gets the cron job killed
     * before it copies the new front-end build to the web root.
     */
    public function test_an_unchanged_reseed_is_skipped(): void
    {
        $this->seed(CourseSeeder::class);
        $before = Category::where('slug', 'ai-ml')->firstOrFail();
        $before->update(['slug' => 'ai-ml-touched']);

        $this->seed(CourseSeeder::class);   // no bypass — should be a no-op

        $this->assertSame('ai-ml-touched', Category::find($before->id)->slug,
            'The fingerprint gate did not skip an unchanged re-seed.');
    }

    /**
     * Nothing may stamp the fingerprint except a seeder that actually ran.
     *
     * A product-page view briefly did, to break a deadlock that reordering the
     * deploy has since removed. It was unsound: the proof it used looked only at
     * rows that exist, so on a populated database it passed for a half-killed
     * run — and stamping then cancels the seeder's repair passes (pruning
     * retired courses, fixing drifted category slugs) permanently, where an
     * unstamped fingerprint just retries next cycle.
     */
    public function test_serving_a_product_page_never_stamps_the_fingerprint(): void
    {
        $this->seed(CourseSeeder::class);
        \App\Models\Setting::query()->delete();          // forget it was ever seeded

        $this->getJson('/api/courses/' . \App\Models\Course::first()->slug)->assertOk();

        $fp = SeedFingerprint::for('courses', [
            database_path('seeders/data/courses.json'),
            database_path('seeders/CourseSeeder.php'),
        ]);
        $this->assertFalse($fp->isCurrent(),
            'Something stamped the catalogue fingerprint without running the seeder.');
    }

    /** A wiped catalogue must re-seed even though the fingerprint still matches. */
    public function test_an_empty_catalogue_reseeds_despite_a_matching_fingerprint(): void
    {
        $this->seed(CourseSeeder::class);
        \App\Models\Course::query()->delete();

        $this->seed(CourseSeeder::class);

        $this->assertGreaterThan(0, \App\Models\Course::count(),
            'An emptied catalogue was left empty by the fingerprint gate.');
    }
}
