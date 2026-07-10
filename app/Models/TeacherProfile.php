<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class TeacherProfile extends Model {
    protected $fillable = ['user_id','headline','qualification','subjects','languages','experience_years','fee_hourly','city','teaching_mode','service_areas','availability','bio','status'];
    protected $casts = ['experience_years' => 'integer', 'fee_hourly' => 'decimal:2', 'availability' => 'array'];

    public function user() { return $this->belongsTo(User::class); }
}
