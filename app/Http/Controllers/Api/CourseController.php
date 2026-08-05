<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Http\Resources\CourseResource;
use App\Models\Category;
use App\Models\Course;
use Illuminate\Http\Request;

class CourseController extends Controller {
    public function index(Request $request) {
        $query = Course::query()->published()->with('categories');

        if ($slug = $request->string('category')->toString()) {
            $cat = Category::where('slug', $slug)->first();
            if ($cat) {
                // Include the category and ALL descendants (any depth), so a parent
                // category surfaces every course in its subtree — matching WooCommerce.
                $ids = $this->descendantIds($cat->id);
                $query->whereHas('categories', fn($q) => $q->whereIn('categories.id', $ids));
            } else {
                // Unknown category slug -> no matches (rather than silently returning all).
                $query->whereRaw('1 = 0');
            }
        }

        if ($q = trim($request->string('search')->toString())) {
            // Tokenised search: split on spaces / & / - / slash, drop stopwords, and
            // require each remaining token to appear in the name or short description.
            // So a nav link like "Art and Painting" still matches "Arts & Painting".
            $stop = ['and','the','for','with','of','to','in','on','a','an','online','class','classes'];
            $tokens = array_values(array_filter(
                preg_split('/[\s&\-\/,]+/', mb_strtolower($q)),
                fn($t) => mb_strlen($t) >= 2 && !in_array($t, $stop, true)
            ));
            if (empty($tokens)) $tokens = [mb_strtolower($q)];
            $query->where(function($s) use ($tokens) {
                foreach ($tokens as $t) {
                    $s->where(fn($w) => $w->where('name','like',"%{$t}%")->orWhere('short_description','like',"%{$t}%"));
                }
            });
        }

        if ($request->boolean('featured')) $query->featured();

        // Effective price = sale price when on sale, else regular price.
        $effective = 'COALESCE(NULLIF(sale_price, 0), regular_price)';
        if (($min = (int) $request->integer('price_min')) > 0) $query->whereRaw("$effective >= ?", [$min]);
        if (($max = (int) $request->integer('price_max')) > 0) $query->whereRaw("$effective <= ?", [$max]);

        // Sort by the effective price so the ordering matches the prices shown.
        match($request->string('sort','popular')->toString()) {
            'price_asc'  => $query->orderByRaw("$effective asc"),
            'price_desc' => $query->orderByRaw("$effective desc"),
            'name'       => $query->orderBy('name'),
            'newest'     => $query->orderByDesc('id'),
            default      => $query->orderByDesc('is_featured')->orderBy('position')->orderBy('name'),
        };

        // Cap high enough that a client can pull the whole catalog in one page
        // (e.g. the product page's "Other Courses" related-products filter, which
        // matches WooCommerce "shares any category"). Default stays small.
        $perPage = max(1, min((int) $request->integer('per_page', 12), 200));
        return CourseResource::collection($query->paginate($perPage));
    }

    /** Category id + all descendant ids (breadth-first, cycle-safe). */
    private function descendantIds(int $rootId): array {
        $all = [$rootId];
        $frontier = [$rootId];
        while ($frontier) {
            $children = Category::whereIn('parent_id', $frontier)
                ->whereNotIn('id', $all)->pluck('id')->all();
            if (!$children) break;
            $all = array_merge($all, $children);
            $frontier = $children;
        }
        return $all;
    }

    public function show(string $slug) {
        $this->selfHealCurriculum();
        $course = Course::where('slug',$slug)->published()->with('categories')->firstOrFail();
        return (new CourseResource($course))->additional(['route' => 'api.courses.show']);
    }

    /**
     * Lazy curriculum self-heal. On Hostinger the cron deploy's DB step dies
     * mid-script, so `db:seed` never runs there and the catalog was serving
     * WITHOUT curriculum even though courses.json (committed) has it. Mirror
     * of the deploy's build self-heal, but app-side: when the sentinel course
     * (mathematics-grade-8, which always has curriculum in courses.json) has
     * none in the DB, run the idempotent CourseSeeder once — triggered by the
     * first product-page visit, throttled by a 6h cache lock, and never
     * allowed to break the request.
     */
    private function selfHealCurriculum(): void {
        try {
            if (!\Illuminate\Support\Facades\Cache::add('courses:curriculum-heal-check', 1, now()->addHours(6))) return;
            $sentinel = Course::where('slug', 'mathematics-grade-8')->first();
            if ($sentinel && count($sentinel->curriculum ?? []) === 0) {
                // bypass(): this is a REPAIR, not an import. courses.json is
                // byte-identical to the last run — that is exactly the case the
                // fingerprint gate skips — but the DB has drifted and only a
                // re-seed fixes it. Without this the heal silently does nothing.
                \App\Support\SeedFingerprint::bypass(fn () =>
                    \Illuminate\Support\Facades\Artisan::call('db:seed', ['--class' => 'Database\\Seeders\\CourseSeeder', '--force' => true]),
                );
            }
        } catch (\Throwable $e) {
            // Self-heal must never take the page down; retry after the lock expires.
        }
    }

}
