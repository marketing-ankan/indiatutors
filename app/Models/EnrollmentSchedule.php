<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * One recurring weekly class on an enrolment — "Tuesdays at 16:00, 60 minutes".
 *
 * A rule, not an event. The dated occurrences are class_logs, written as
 * classes are actually held; this says what is supposed to happen every week.
 */
class EnrollmentSchedule extends Model
{
    /** ISO-8601, so index 1 is Monday — matches Carbon's dayOfWeekIso. */
    public const DAYS = [1 => 'Monday', 2 => 'Tuesday', 3 => 'Wednesday', 4 => 'Thursday',
                         5 => 'Friday', 6 => 'Saturday', 7 => 'Sunday'];

    protected $fillable = ['enrollment_id', 'weekday', 'start_time', 'duration_minutes', 'active', 'note'];

    protected $casts = [
        'weekday'          => 'integer',
        'duration_minutes' => 'integer',
        'active'           => 'boolean',
    ];

    public function enrollment() { return $this->belongsTo(Enrollment::class); }

    public function scopeActive($q) { return $q->where('active', true); }

    public function getDayNameAttribute(): string
    {
        return self::DAYS[$this->weekday] ?? '—';
    }

    /** "Tuesdays at 4:00 PM" — the way a parent would say it. */
    public function getLabelAttribute(): string
    {
        $time = \Illuminate\Support\Carbon::createFromFormat('H:i:s', $this->start_time)->format('g:i A');
        return "{$this->day_name}s at {$time}";
    }
}
