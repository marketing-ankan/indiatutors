<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Review extends Model {
    protected $fillable = [
        'course_id','video_course_id','user_id','author_name','author_email',
        'rating','body','status','created_by',
    ];
    protected $casts = ['rating' => 'integer'];

    public function course()      { return $this->belongsTo(Course::class); }
    public function videoCourse() { return $this->belongsTo(VideoCourse::class); }
    public function user()        { return $this->belongsTo(User::class); }

    public function scopeApproved($q) { return $q->where('status', 'approved'); }

    /** What the review is about, whichever of the two catalogues it came from. */
    public function getSubjectNameAttribute(): ?string {
        return $this->course?->name ?? $this->videoCourse?->title;
    }
}
