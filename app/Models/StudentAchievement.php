<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Something a student achieved and credits to a teacher or to the platform.
 *
 * The honest replacement for the invented testimonials this site has been
 * carrying: written by a named family, tied to a real student, and publishable
 * only where consent was actually given.
 */
class StudentAchievement extends Model
{
    public const STATUSES = ['pending', 'approved', 'rejected'];

    protected $fillable = [
        'student_id', 'submitted_by', 'tutor_id',
        'title', 'body', 'achieved_on',
        'consent_public', 'consent_name', 'status', 'staff_note',
    ];

    protected $casts = [
        'achieved_on'    => 'date',
        'consent_public' => 'boolean',
        'consent_name'   => 'boolean',
    ];

    public function student()   { return $this->belongsTo(Student::class); }
    public function tutor()     { return $this->belongsTo(Tutor::class); }
    public function submitter() { return $this->belongsTo(User::class, 'submitted_by'); }

    public function scopeApproved($q) { return $q->where('status', 'approved'); }

    /**
     * Safe to show on a public page: approved AND the family agreed to
     * publication. Two conditions, because staff approving a submission is not
     * the same as a family offering it for publication — the audit that found
     * photos of identifiable minors is exactly what happens when those two are
     * collapsed into one.
     */
    public function scopePublishable($q)
    {
        return $q->where('status', 'approved')->where('consent_public', true);
    }

    /** How the author should be credited in public, honouring consent_name. */
    public function getDisplayNameAttribute(): string
    {
        if ($this->consent_name && $this->student?->name) {
            return $this->student->name;
        }
        $grade = $this->student?->grade;
        return $grade ? "A {$grade} student" : 'A student';
    }
}
