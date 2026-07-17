<?php
namespace App\Models;

use App\Support\BunnyStream;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VideoLesson extends Model {
    protected $guarded = [];
    protected $casts = ['is_preview' => 'boolean', 'duration_seconds' => 'integer', 'position' => 'integer'];

    public function course(): BelongsTo { return $this->belongsTo(VideoCourse::class, 'video_course_id'); }

    /**
     * A playable embed URL for this lesson, or null when it must stay locked.
     * $unlocked = the viewer is entitled (or the lesson is a free preview).
     * YouTube previews embed directly; Bunny videos get a short-lived signed URL.
     */
    public function playbackUrl(bool $unlocked): ?string {
        if (!$unlocked) return null;
        if ($this->provider === 'youtube') {
            return "https://www.youtube-nocookie.com/embed/{$this->video_id}";
        }
        // Bunny: signed if configured, else unsigned (works only on a public library).
        return BunnyStream::signedEmbedUrl($this->video_id) ?? BunnyStream::embedUrl($this->video_id);
    }
}
