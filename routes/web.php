<?php
use App\Http\Controllers\SitemapController;
use App\Support\SeoMeta;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/sitemap.xml', [SitemapController::class, 'index']);
Route::get('/robots.txt', [SitemapController::class, 'robots']);

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
    'privacy-policy'         => '/privacy',
    'terms-of-service'       => '/terms',
    'refund-policy'          => '/refund',
    'refund_returns'         => '/refund',
    'my-account'             => '/login',
    'hello-world'            => '/blog/hello-world',
    'sample-page'            => '/',
    'tutors'                 => '/find-tutors',
    'tutors/kolkata'         => '/tutors-in/kolkata',
    'category/uncategorized' => '/blog',
] as $from => $to) {
    Route::redirect('/'.$from, $to, 301);
}
Route::get('/product/{slug}', fn (string $slug) => redirect('/courses/'.$slug, 301));
// WP category URLs nest parents (/product-category/dance/kathak/); the last
// segment is the category slug our archive filters on.
Route::get('/product-category/{path}', function (string $path) {
    $slug = collect(explode('/', trim($path, '/')))->last();
    return redirect('/courses?category='.$slug, 301);
})->where('path', '.*');

// Serve the React app for all other routes (React Router handles client-side
// routing); inject per-route SEO meta so crawlers get a real title/description.
Route::get('/{any?}', function (Request $request) {
    return view('app', ['meta' => SeoMeta::for($request)]);
})->where('any', '.*');
