<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;

/**
 * Lists the images already shipped with the site, so admin forms can offer a
 * picker instead of asking someone to type a path from memory.
 *
 * Deliberately a browser over committed files rather than an uploader. Uploading
 * has nowhere to land on this host: the deploy does `rm -rf` on the docroot
 * images directory before re-copying it, and `vite build` empties public/build,
 * so anything written at runtime is destroyed by the next cron pull. New artwork
 * is added by committing it to public/images/, which the build ships to
 * /build/images/ — the paths returned here.
 */
class AdminMediaController extends Controller
{
    /** Directories worth offering. `site` is the logo; nobody picks that as card art. */
    private const DIRS = ['courses', 'home', 'workshops', 'teachers', 'news', 'achievements'];

    public function images()
    {
        $out = [];
        foreach (self::DIRS as $dir) {
            $path = public_path('images/' . $dir);
            if (!is_dir($path)) continue;

            foreach (scandir($path) ?: [] as $file) {
                if (!preg_match('~\.(jpe?g|png|webp|gif|avif)$~i', $file)) continue;
                $out[] = [
                    // What gets stored. The build copies public/images ->
                    // public/build/images, so this is the URL that actually resolves.
                    'path'  => '/build/images/' . $dir . '/' . $file,
                    'name'  => pathinfo($file, PATHINFO_FILENAME),
                    'group' => $dir,
                ];
            }
        }

        return response()->json(['data' => $out]);
    }
}
