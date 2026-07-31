<?php
namespace App\Models;

use App\Support\BunnyStream;
use App\Support\R2Video;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VideoLesson extends Model {
    protected $guarded = [];
    protected $casts = ['is_preview' => 'boolean', 'duration_seconds' => 'integer', 'position' => 'integer'];

    public function course(): BelongsTo { return $this->belongsTo(VideoCourse::class, 'video_course_id'); }

    /**
     * A playable URL for this lesson, or null when it must stay locked.
     * $unlocked = the viewer is entitled (or the lesson is a free preview).
     * YouTube previews embed directly; Bunny and R2 get short-lived signed URLs.
     */
    public function playbackUrl(bool $unlocked): ?string {
        if (!$unlocked) return null;
        if ($this->provider === 'youtube') {
            return "https://www.youtube-nocookie.com/embed/{$this->video_id}";
        }
        if ($this->provider === 'r2') {
            // video_id holds the R2 object key, e.g. "python-for-kids/1.mp4".
            return R2Video::signedUrl($this->video_id);
        }
        // Bunny: signed if configured, else unsigned (works only on a public library).
        return BunnyStream::signedEmbedUrl($this->video_id) ?? BunnyStream::embedUrl($this->video_id);
    }

    /**
     * How the front end must render playbackUrl(): Bunny and YouTube hand back a
     * player page for an <iframe>, R2 hands back a bare MP4 for a <video> tag.
     */
    public function playbackKind(): string {
        return $this->provider === 'r2' ? 'video' : 'iframe';
    }
}
