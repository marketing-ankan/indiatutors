<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class TeacherProfile extends Model {
    // changes_submitted_at / published_at are deliberately NOT fillable: they
    // are the review gate, and a mass-assign from a teacher's own form must
    // never be able to mark their edits as already reviewed.
    protected $fillable = ['user_id','headline','qualification','subjects','languages','experience_years','fee_hourly','city','teaching_mode','service_areas','availability','bio','status'];
    protected $casts = [
        'experience_years'     => 'integer',
        'fee_hourly'           => 'decimal:2',
        'availability'         => 'array',
        'changes_submitted_at' => 'datetime',
        'published_at'         => 'datetime',
    ];

    /** Edits the teacher has made that a human has not yet published. */
    public function hasUnpublishedChanges(): bool
    {
        return $this->changes_submitted_at !== null;
    }

    public function user() { return $this->belongsTo(User::class); }
}
