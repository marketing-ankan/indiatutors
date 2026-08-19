<?php

namespace App\Providers;

use App\Support\WebRootVite;
use Illuminate\Foundation\Vite;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // `@vite(...)` compiles to app(Illuminate\Foundation\Vite::class), and
        // the framework registers that key as a plain singleton, so replacing
        // the binding here is all it takes to change which manifest the asset
        // tags are rendered from. See WebRootVite: on this host the directory
        // the browser fetches from is not the directory @vite reads, and every
        // deploy has a window where the two disagree and the site goes blank.
        // Falls straight through to the framework's own behaviour anywhere the
        // split layout is not detected, which includes local development.
        $this->app->singleton(Vite::class, fn () => new WebRootVite);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Every generated URL follows APP_URL's scheme. Belt to the
        // EnforceCanonicalOrigin braces: even on a request that arrived
        // through an untrusted hop, route()/url()/asset() never emit an
        // http:// link onto an https page. Keyed off APP_URL rather than the
        // environment so local http dev is untouched.
        if (str_starts_with((string) config('app.url'), 'https://')) {
            URL::forceScheme('https');
        }
    }
}
