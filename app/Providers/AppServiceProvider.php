<?php

namespace App\Providers;

use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
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
