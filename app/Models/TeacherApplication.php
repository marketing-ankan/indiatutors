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
}
