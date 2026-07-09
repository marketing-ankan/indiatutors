<?php
use App\Http\Controllers\SitemapController;
use App\Support\SeoMeta;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/sitemap.xml', [SitemapController::class, 'index']);
Route::get('/robots.txt', [SitemapController::class, 'robots']);

// Serve the React app for all other routes (React Router handles client-side
// routing); inject per-route SEO meta so crawlers get a real title/description.
Route::get('/{any?}', function (Request $request) {
    return view('app', ['meta' => SeoMeta::for($request)]);
})->where('any', '.*');
