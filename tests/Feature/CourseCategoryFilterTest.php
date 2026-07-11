<?php
namespace Tests\Feature;

use App\Models\Category;
use App\Models\Course;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CourseCategoryFilterTest extends TestCase
{
    use RefreshDatabase;

    private function course(string $name, Category $cat): Course
    {
        $c = Course::create(['name' => $name, 'slug' => \Illuminate\Support\Str::slug($name), 'is_published' => true, 'regular_price' => 100]);
        $c->categories()->attach($cat->id);
        return $c;
    }

    public function test_parent_category_includes_courses_from_all_descendant_levels(): void
    {
        $parent = Category::create(['name' => 'Academics', 'slug' => 'academics']);
        $child  = Category::create(['name' => 'High School', 'slug' => 'high-school', 'parent_id' => $parent->id]);
        $grand  = Category::create(['name' => 'Algebra', 'slug' => 'algebra', 'parent_id' => $child->id]);
        $other  = Category::create(['name' => 'Music', 'slug' => 'music']);

        $this->course('Directly on parent', $parent);
        $this->course('On child', $child);
        $this->course('On grandchild', $grand);   // the one the old 1-level filter missed
        $this->course('Unrelated', $other);

        // Filtering the top-level parent must surface all three in its subtree, not the unrelated one.
        $this->getJson('/api/courses?category=academics')
            ->assertOk()
            ->assertJsonPath('meta.total', 3);

        // Filtering the grandchild returns just its own course.
        $this->getJson('/api/courses?category=algebra')
            ->assertOk()
            ->assertJsonPath('meta.total', 1);
    }

    public function test_tokenised_search_matches_across_word_variants(): void
    {
        $cat = Category::create(['name' => 'Creative', 'slug' => 'creative']);
        $this->course('Arts & Painting', $cat);
        $this->course('Digital SAT/PSAT Math', $cat);
        $this->course('Piano', $cat);

        // Nav link "Art and Painting" must still find "Arts & Painting".
        $this->getJson('/api/courses?search=' . urlencode('Art and Painting'))
            ->assertOk()->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.name', 'Arts & Painting');

        // Multi-token still narrows correctly.
        $this->getJson('/api/courses?search=' . urlencode('SAT Math'))
            ->assertOk()->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.name', 'Digital SAT/PSAT Math');
    }

    public function test_unknown_category_returns_no_courses(): void
    {
        $cat = Category::create(['name' => 'Music', 'slug' => 'music']);
        $this->course('Piano', $cat);

        $this->getJson('/api/courses?category=does-not-exist')
            ->assertOk()
            ->assertJsonPath('meta.total', 0);
    }
}
