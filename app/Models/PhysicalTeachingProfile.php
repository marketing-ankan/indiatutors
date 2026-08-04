<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PhysicalTeachingProfile extends Model
{
    protected $fillable = [
        'user_id', 'teacher_application_id',
        'gender', 'date_of_birth', 'nationality', 'languages',
        'address_line1', 'address_line2', 'landmark', 'locality', 'city', 'district', 'state',
        'pincode', 'country', 'latitude', 'longitude', 'geo_source', 'geo_accuracy_m',
        'service_radius_km', 'extra_pincodes', 'travel_mode', 'max_travel_minutes',
        'travel_outside_city', 'travel_fee_per_visit',
        'at_student_home', 'at_own_place', 'at_public_place', 'own_place_capacity',
        'max_students', 'max_hours_per_week', 'preferred_session_minutes', 'notice_hours',
        'available_from', 'on_break_until',
        'preferred_student_gender', 'teaches_group', 'max_batch_size', 'special_needs_experience',
        'min_fee_hourly', 'min_fee_monthly',
        'police_verified', 'police_verified_on', 'experience_years',
        'notes', 'status', 'submitted_at',
    ];

    protected $casts = [
        'date_of_birth'            => 'date',
        'available_from'           => 'date',
        'on_break_until'           => 'date',
        'police_verified_on'       => 'date',
        'submitted_at'             => 'datetime',
        'latitude'                 => 'float',
        'longitude'                => 'float',
        'travel_outside_city'      => 'boolean',
        'at_student_home'          => 'boolean',
        'at_own_place'             => 'boolean',
        'at_public_place'          => 'boolean',
        'teaches_group'            => 'boolean',
        'special_needs_experience' => 'boolean',
        'police_verified'          => 'boolean',
        'travel_fee_per_visit'     => 'decimal:2',
        'min_fee_hourly'           => 'decimal:2',
        'min_fee_monthly'          => 'decimal:2',
    ];

    public function user()        { return $this->belongsTo(User::class); }
    public function application() { return $this->belongsTo(TeacherApplication::class, 'teacher_application_id'); }
    public function offerings()   { return $this->hasMany(TeachingOffering::class, 'profile_id'); }
    public function slots()       { return $this->hasMany(TeachingAvailabilitySlot::class, 'profile_id')->orderBy('weekday')->orderBy('start_time'); }
    public function exceptions()  { return $this->hasMany(TeachingAvailabilityException::class, 'profile_id')->orderBy('date'); }

    public function csv(string $field): array
    {
        return array_values(array_filter(array_map('trim', explode(',', (string) $this->{$field}))));
    }

    /**
     * How much of the profile is usable, 0–100. Drives the teacher-facing nudge
     * ("add availability to start getting matched") and lets staff triage a
     * queue by who is actually ready rather than by who applied first.
     *
     * The weights follow what the leads-management software cannot work
     * without: with no location, no subjects or no availability, a profile
     * fails every filter downstream whatever else is filled in — so those three
     * carry the bulk. See docs/MATCHING-DATA-CONTRACT.md §7.
     */
    public function completeness(): int
    {
        $score = 0;
        if ($this->pincode)                              $score += 10;
        if ($this->address_line1 && $this->city)         $score += 10;
        if ($this->latitude !== null)                    $score += 15;
        if ($this->service_radius_km > 0 || $this->at_own_place) $score += 10;
        if ($this->offerings()->exists())                $score += 20;
        if ($this->slots()->exists())                    $score += 20;
        if ($this->languages)                            $score += 5;
        if ($this->gender)                               $score += 5;
        if ($this->experience_years !== null)            $score += 5;

        return min(100, $score);
    }
}
