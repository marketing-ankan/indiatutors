<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * One dated class the assigned teacher cannot take, and what was done about it.
 *
 * Deliberately a deviation record, not a calendar: it exists only when the
 * standing timetable (enrollment_schedules) is not going to happen as written.
 */
class ClassAbsence extends Model
{
    public const STATUSES = ['requested', 'covered', 'online', 'uncovered', 'cancelled'];

    /** Resolutions where the class still goes ahead for the family. */
    public const GOES_AHEAD = ['covered', 'online'];

    protected $fillable = [
        'enrollment_id', 'enrollment_schedule_id', 'occurs_on', 'start_time',
        'original_tutor_id', 'substitute_tutor_id', 'status', 'reason',
        'auto_assigned', 'decided_by', 'resolved_at',
    ];

    protected $casts = [
        'occurs_on'     => 'date',
        'auto_assigned' => 'boolean',
        'resolved_at'   => 'datetime',
    ];

    public function enrollment()   { return $this->belongsTo(Enrollment::class); }
    public function schedule()     { return $this->belongsTo(EnrollmentSchedule::class, 'enrollment_schedule_id'); }
    public function originalTutor(){ return $this->belongsTo(Tutor::class, 'original_tutor_id'); }
    public function substitute()   { return $this->belongsTo(Tutor::class, 'substitute_tutor_id'); }

    /** Needs a human — nobody could cover it automatically. */
    public function scopeNeedsAttention($q) { return $q->whereIn('status', ['requested', 'uncovered']); }

    public function scopeUpcoming($q) { return $q->whereDate('occurs_on', '>=', now()->toDateString()); }
}
