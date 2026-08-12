<?php
namespace App\Support;

/**
 * Turns whatever an admin pastes into the bare video id the player needs.
 *
 * VideoLesson::playbackUrl() interpolates `video_id` straight into
 * https://www.youtube-nocookie.com/embed/{id}. Before this existed the admin
 * form asked for an "id" and stored the field verbatim, so pasting a real
 * https://www.youtube.com/watch?v=... URL produced a dead embed with no error
 * anywhere — the lesson simply never played. Normalising here means the API is
 * safe too, not just the form.
 */
class VideoSource
{
    /**
     * A YouTube id is exactly 11 characters of [A-Za-z0-9_-]. Every URL form
     * places it directly after a known marker, so we look for the marker rather
     * than trying to parse the URL — that survives extra query parameters
     * (?t=, ?si=, playlist ids) without needing to strip them.
     *
     * Returns null when nothing recognisable is found, so the caller can refuse
     * the input instead of storing a string that will never play.
     */
    public static function youtubeId(string $input): ?string
    {
        $s = trim($input);
        if ($s === '') {
            return null;
        }

        // Already a bare id.
        if (preg_match('~^[A-Za-z0-9_-]{11}$~', $s)) {
            return $s;
        }

        foreach ([
            '~[?&]v=([A-Za-z0-9_-]{11})~',        // youtube.com/watch?v=ID
            '~youtu\.be/([A-Za-z0-9_-]{11})~',    // youtu.be/ID  (share button)
            '~/embed/([A-Za-z0-9_-]{11})~',       // youtube.com/embed/ID
            '~/shorts/([A-Za-z0-9_-]{11})~',      // youtube.com/shorts/ID
            '~/live/([A-Za-z0-9_-]{11})~',        // youtube.com/live/ID
            '~/v/([A-Za-z0-9_-]{11})~',           // legacy /v/ID
        ] as $pattern) {
            if (preg_match($pattern, $s, $m)) {
                return $m[1];
            }
        }

        return null;
    }
}
