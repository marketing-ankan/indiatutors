<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class TeacherApplication extends Model {
    protected $fillable = [
        'name', 'email', 'phone', 'subjects', 'cv_path', 'cv_name', 'video_url',
        'address', 'city', 'pincode', 'service_radius_km', 'teaches_online',
        'availability', 'notes', 'status',
    ];
    protected $casts = [
        'subjects'       => 'array',
        'availability'   => 'array',
        'teaches_online' => 'boolean',
    ];

    /**
     * The physical-tuition record captured with this application. It is the same
     * row the teacher later edits from their dashboard — approving an
     * application just points it at their user_id, so nothing is copied and the
     * two can never drift apart.
     */
    public function physicalProfile() { return $this->hasOne(PhysicalTeachingProfile::class); }
}
