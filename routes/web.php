<?php
use App\Http\Controllers\CurriculumPdfController;
use App\Http\Controllers\SitemapController;
use App\Support\SeoMeta;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;

Route::get('/sitemap.xml', [SitemapController::class, 'index']);
Route::get('/robots.txt', [SitemapController::class, 'robots']);

// Designed curriculum PDF, generated server-side (see CurriculumPdfController).
// Rate-limited because each render costs real CPU.
Route::get('/curriculum/{slug}.pdf', [CurriculumPdfController::class, 'show'])
    ->where('slug', '[a-z0-9-]+')
    ->middleware('throttle:30,1')
    ->name('curriculum.pdf');

// --- 301 redirect map: old WordPress/WooCommerce URLs → new URLs ---
// Ready for the real-domain cutover; harmless on staging. URLs the two sites
// share (/cart, /contact, /group-classes, /tutor/{slug}, /subject/{slug}, …)
// need no entry.
foreach ([
    'shop'                   => '/courses',
    'about-us'               => '/about',
    'refer-and-earn'         => '/refer-earn',
    'plans-pricing'          => '/plans',
    'plans-and-pricing'      => '/plans',
    // Policy pages: /privacy-policy keeps its WordPress URL (it is now a real
    // page), the other legacy spellings 301 onto the four canonical policies.
    'terms-of-service'       => '/terms-conditions',
    'refund-policy'          => '/payment-refund-policy',
    'refund_returns'         => '/payment-refund-policy',
    'privacy'                => '/privacy-policy',
    'terms'                  => '/terms-conditions',
    'refund'                 => '/payment-refund-policy',
    'my-account'             => '/login',
    'hello-world'            => '/blog/hello-world',
    'sample-page'            => '/',
    'tutors'                 => '/find-tutors',
    'tutors/kolkata'         => '/tutors-in/kolkata',
    'category/uncategorized' => '/blog',
] as $from => $to) {
    Route::redirect('/'.$from, $to, 301);
}
// Courses dropped in the India-localisation pass: the US College Board tests and
// the US high-school maths/"Honors" pathway, neither of which maps to any Indian
// board syllabus. Their old URLs 301 to /courses rather than 404.
$retiredUS = [
    'sat-psat-math-mastery', 'digital-sat-psat-math', 'english-sat-psat',
    'math-sat-psat', 'nmsqt', 'act',
    'integrated-math-i-ii-iii', 'algebra-i', 'algebra-ii', 'algebra-i-foundation',
    'geometry', 'pre-calculus', 'calculus',
    'honors-chemistry', 'honors-biology', 'honors-physics',
];
$retiredPattern = 'ap-.+|'.implode('|', $retiredUS);
// Courses renamed in the same pass — "Social Studies" is not an Indian subject
// (CBSE says Social Science, CISCE says History, Civics and Geography), and the
// Classes 11-12 one split into the three separately-examined subjects.
$renamedCourses = [
    'social-studies-grade-1-7'  => 'social-science-grade-1-7',
    'social-studies-grade-8'    => 'social-science-grade-8',
    'social-studies-grade-9-10' => 'social-science-grade-9-10',
];
$courseTarget = function (string $slug) use ($retiredUS, $renamedCourses) {
    if (Str::startsWith($slug, 'ap-') || in_array($slug, $retiredUS, true)) return '/courses';
    if (isset($renamedCourses[$slug])) return '/courses/'.$renamedCourses[$slug];
    if ($slug === 'social-studies-grade-11-12') return '/courses?category=academics-secondary-senior-secondary-classes-9-12';
    return '/courses/'.$slug;
};
// The constraint means only retired/renamed slugs hit this — every other
// /courses/{slug} still falls through to the SPA catch-all below.
$movedPattern = $retiredPattern.'|social-studies-grade-.+';
Route::get('/courses/{slug}', fn (string $slug) => redirect($courseTarget($slug), 301))->where('slug', $movedPattern);
Route::get('/product/{slug}', fn (string $slug) => redirect($courseTarget($slug), 301));

// Categories renamed to the Indian bands in the same pass.
$renamedCategories = [
    'academics-elementary-middle-school' => 'academics-primary-middle-classes-1-8',
    'academics-high-school'              => 'academics-secondary-senior-secondary-classes-9-12',
    'social-studies'                     => 'social-science',
];
// WP category URLs nest parents (/product-category/dance/kathak/); the last
// segment is the category slug our archive filters on.
Route::get('/product-category/{path}', function (string $path) use ($renamedCategories) {
    $slug = collect(explode('/', trim($path, '/')))->last();
    return redirect('/courses?category='.($renamedCategories[$slug] ?? $slug), 301);
})->where('path', '.*');

// Serve the React app for all other routes (React Router handles client-side
// routing); inject per-route SEO meta so crawlers get a real title/description.
//
// `api/*` is excluded. Without that, an unmatched API path falls through to
// here and answers 200 with the SPA's HTML — so a typo'd endpoint or a route
// that has been removed looks like a success to the caller, and a JSON client
// fails later, somewhere unrelated, trying to parse a page.
Route::get('/{any?}', function (Request $request) {
    abort_if($request->is('api/*'), 404);

    // This is the request that is about to tell the browser which JS bundle to
    // load, so it is the right place to make sure that bundle is actually
    // present in the web root. See DocrootBuild: the deploy is regularly killed
    // before it copies the build across, and without this the site is blank
    // until the next cron cycle notices. Cheap and non-throwing.
    \App\Support\DocrootBuild::ensure();

    return view('app', ['meta' => SeoMeta::for($request)]);
})->where('any', '.*');
