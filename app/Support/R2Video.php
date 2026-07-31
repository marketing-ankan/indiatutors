<?php
namespace App\Support;

/**
 * Cloudflare R2 — presigned playback URLs for self-hosted course video.
 *
 * Why R2 rather than a video host: the buy rail promises "Lifetime access" and
 * "Rewatch every lesson as often as you like", which is an unmetered promise.
 * R2 never bills egress, so unlimited rewatching by an unbounded number of past
 * buyers stays free forever; only stored bytes cost anything (first 10 GB free,
 * ~$0.015/GB/month after). A bandwidth-metered tier cannot back that promise —
 * it gets tighter as lifetime buyers accumulate.
 *
 * Access control is a short-lived AWS SigV4 presigned GET: the bucket stays
 * private, and a leaked URL dies when it expires. Same contract as
 * {@see BunnyStream} — config-driven, and signedUrl() returns null until the
 * keys are set, so callers fall back to "locked" and the app ships without R2.
 *
 * Signed by hand rather than via the AWS SDK on purpose: the SDK would add
 * ~15 MB to the committed vendor/ (the server has no Composer), for one
 * presigned GET. Range requests still work — only `host` is signed — so seeking
 * inside a lesson behaves normally.
 */
class R2Video {
    /** R2 speaks the S3 API with a fixed pseudo-region. */
    private const REGION  = 'auto';
    private const SERVICE = 's3';

    public static function enabled(): bool {
        $c = config('services.r2');
        return (bool) (($c['account_id'] || $c['endpoint']) && $c['bucket'] && $c['access_key'] && $c['secret_key']);
    }

    /**
     * A short-lived signed URL for an R2 object key (e.g. "python-for-kids/1.mp4").
     * Defaults to a 4h window, matching the Bunny adapter. Returns null when R2
     * isn't configured.
     */
    public static function signedUrl(string $key, int $ttlSeconds = 14400): ?string {
        if (!self::enabled()) return null;
        $c = config('services.r2');

        // Endpoint override lets this point at a custom domain, another
        // S3-compatible host (Backblaze B2), or a plain static server while
        // testing locally. Default is R2's own endpoint.
        $endpoint = $c['endpoint'] ?: "https://{$c['account_id']}.r2.cloudflarestorage.com";
        $parts    = parse_url($endpoint);
        $scheme   = $parts['scheme'] ?? 'https';
        // SigV4 signs the host header, which carries the port when non-default.
        $host      = $parts['host'] . (isset($parts['port']) ? ':' . $parts['port'] : '');
        $now       = time();
        $amzDate   = gmdate('Ymd\THis\Z', $now);
        $dateStamp = gmdate('Ymd', $now);
        $scope     = $dateStamp . '/' . self::REGION . '/' . self::SERVICE . '/aws4_request';

        // Path-style addressing: /{bucket}/{key}. Every segment is rfc3986-encoded
        // but the separating slashes must survive, hence the %2F restore.
        $canonicalUri = '/' . rawurlencode($c['bucket'])
            . '/' . str_replace('%2F', '/', rawurlencode(ltrim($key, '/')));

        $query = [
            'X-Amz-Algorithm'     => 'AWS4-HMAC-SHA256',
            'X-Amz-Credential'    => $c['access_key'] . '/' . $scope,
            'X-Amz-Date'          => $amzDate,
            'X-Amz-Expires'       => (string) $ttlSeconds,
            'X-Amz-SignedHeaders' => 'host',
        ];
        ksort($query); // SigV4 requires the canonical query sorted by name.
        $canonicalQuery = implode('&', array_map(
            fn ($k, $v) => rawurlencode($k) . '=' . rawurlencode($v),
            array_keys($query),
            $query
        ));

        // The trailing "\n" on the host header closes the canonical-headers block;
        // implode's separator then supplies the blank line SigV4 expects after it.
        $canonicalRequest = implode("\n", [
            'GET',
            $canonicalUri,
            $canonicalQuery,
            "host:{$host}\n",
            'host',
            'UNSIGNED-PAYLOAD',
        ]);

        $stringToSign = implode("\n", [
            'AWS4-HMAC-SHA256',
            $amzDate,
            $scope,
            hash('sha256', $canonicalRequest),
        ]);

        $kDate     = hash_hmac('sha256', $dateStamp,     'AWS4' . $c['secret_key'], true);
        $kRegion   = hash_hmac('sha256', self::REGION,   $kDate,    true);
        $kService  = hash_hmac('sha256', self::SERVICE,  $kRegion,  true);
        $kSigning  = hash_hmac('sha256', 'aws4_request', $kService, true);
        $signature = hash_hmac('sha256', $stringToSign,  $kSigning);

        return "{$scheme}://{$host}{$canonicalUri}?{$canonicalQuery}&X-Amz-Signature={$signature}";
    }
}
