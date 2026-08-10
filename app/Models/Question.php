<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** One multiple-choice question in the bank (F7). */
class Question extends Model
{
    protected $fillable = [
        'video_lesson_id', 'video_course_id', 'level', 'topic',
        'prompt', 'options', 'correct_key', 'explanation', 'is_published', 'position',
    ];

    protected $casts = [
        'options'      => 'array',
        'level'        => 'integer',
        'position'     => 'integer',
        'is_published' => 'boolean',
    ];

    public function lesson()   { return $this->belongsTo(VideoLesson::class, 'video_lesson_id'); }
    public function course()   { return $this->belongsTo(VideoCourse::class, 'video_course_id'); }
    public function attempts() { return $this->hasMany(QuestionAttempt::class); }

    public function scopePublished($q) { return $q->where('is_published', true); }

    /**
     * The question as a STUDENT may see it — no correct_key, no explanation.
     * Serving those with the paper turns the quiz into a lookup, and the score
     * then drives a weakness verdict that would be meaningless.
     */
    public function toStudentArray(): array
    {
        return [
            'id'      => $this->id,
            'level'   => $this->level,
            'topic'   => $this->topic,
            'prompt'  => $this->prompt,
            'options' => collect($this->options ?? [])->map(fn ($o) => [
                'key'  => $o['key'] ?? null,
                'text' => $o['text'] ?? '',
            ])->values()->all(),
        ];
    }
}
