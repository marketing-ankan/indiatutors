<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TeachingAvailabilityException extends Model
{
    protected $table    = 'teaching_availability_exceptions';
    protected $fillable = ['profile_id', 'date', 'is_available', 'start_time', 'end_time', 'reason'];
    protected $casts    = ['date' => 'date', 'is_available' => 'boolean'];

    public function profile() { return $this->belongsTo(PhysicalTeachingProfile::class, 'profile_id'); }
}
