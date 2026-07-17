<?php
namespace App\Support;

/**
 * Bunny.net Stream helper — signs gated playback (embed) URLs so paid course
 * videos can only be watched by entitled users, for a short window.
 *
 * Config-driven: enabled() is false until BUNNY_STREAM_LIBRARY_ID + _TOKEN_KEY
 * are set, so the app ships and runs (preview/YouTube lessons play) before the
 * account exists. Bunny's token auth is SHA256(tokenKey + videoId + expires).
 */
class BunnyStream {
    public static function enabled(): bool {
        return (bool) (config('services.bunny.library_id') && config('services.bunny.token_key'));
    }

    /**
     * A short-lived signed embed URL for a Bunny video GUID.
     * Returns null when Bunny isn't configured — callers fall back to “locked”.
     */
    public static function signedEmbedUrl(string $videoId, int $ttlSeconds = 14400): ?string {
        if (!self::enabled()) return null;
        $library = config('services.bunny.library_id');
        $key     = config('services.bunny.token_key');
        $host    = config('services.bunny.embed_host');
        $expires = time() + $ttlSeconds;
        $token   = hash('sha256', $key . $videoId . $expires);
        return "https://{$host}/embed/{$library}/{$videoId}?token={$token}&expires={$expires}&autoplay=false";
    }

    /** Unsigned embed URL — only usable while a library is set to public. */
    public static function embedUrl(string $videoId): ?string {
        $library = config('services.bunny.library_id');
        if (!$library) return null;
        $host = config('services.bunny.embed_host');
        return "https://{$host}/embed/{$library}/{$videoId}";
    }
}
