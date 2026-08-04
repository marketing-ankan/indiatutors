<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TuitionRequirement extends Model
{
    protected $fillable = [
        'code', 'user_id', 'student_id', 'demo_request_id',
        'contact_name', 'contact_phone', 'contact_email', 'relationship', 'whatsapp_consent', 'best_time_to_call',
        'learner_name', 'learner_gender', 'learner_dob', 'grade', 'board', 'school', 'medium', 'languages', 'learner_count',
        'subjects', 'goal', 'exam_target', 'focus_areas', 'special_needs', 'special_needs_note',
        'address_line1', 'address_line2', 'landmark', 'locality', 'city', 'district', 'state',
        'pincode', 'country', 'latitude', 'longitude', 'geo_source',
        'venue_preference', 'max_teacher_distance_km', 'willing_to_travel_km',
        'preferred_days', 'preferred_time_windows', 'sessions_per_week', 'session_minutes', 'start_date', 'urgency',
        'budget_min_hourly', 'budget_max_hourly', 'budget_monthly',
        'preferred_teacher_gender', 'preferred_teacher_languages', 'min_teacher_experience', 'group_ok',
        'status', 'matched_profile_id', 'matched_at', 'notes',
    ];

    protected $casts = [
        'learner_dob'                 => 'date',
        'start_date'                  => 'date',
        'matched_at'                  => 'datetime',
        'languages'                   => 'array',
        'subjects'                    => 'array',
        'preferred_days'              => 'array',
        'preferred_time_windows'      => 'array',
        'preferred_teacher_languages' => 'array',
        'latitude'                    => 'float',
        'longitude'                   => 'float',
        'grade'                       => 'integer',
        'whatsapp_consent'            => 'boolean',
        'special_needs'               => 'boolean',
        'group_ok'                    => 'boolean',
        'budget_min_hourly'           => 'decimal:2',
        'budget_max_hourly'           => 'decimal:2',
        'budget_monthly'              => 'decimal:2',
    ];

    /** Same reasoning as Student::$code — the code gets quoted on calls, so it is assigned once. */
    protected static function booted(): void
    {
        static::created(function (TuitionRequirement $r) {
            if (!$r->code) $r->forceFill(['code' => 'REQ-' . (100000 + $r->id)])->saveQuietly();
        });
    }

    public function user()    { return $this->belongsTo(User::class); }
    public function student() { return $this->belongsTo(Student::class); }
    public function matchedProfile() { return $this->belongsTo(PhysicalTeachingProfile::class, 'matched_profile_id'); }
}
