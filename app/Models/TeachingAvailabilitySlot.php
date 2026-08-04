<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TeachingAvailabilitySlot extends Model
{
    protected $fillable = ['profile_id', 'weekday', 'start_time', 'end_time'];
    protected $casts    = ['weekday' => 'integer'];

    public function profile() { return $this->belongsTo(PhysicalTeachingProfile::class, 'profile_id'); }

    /** "17:00:00" -> "17:00". MySQL hands back seconds; sqlite hands back what we stored. */
    public function getStartAttribute(): string { return substr((string) $this->start_time, 0, 5); }
    public function getEndAttribute(): string   { return substr((string) $this->end_time, 0, 5); }
}
