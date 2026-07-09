<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class TeacherProfile extends Model {
    protected $fillable = ['user_id','headline','subjects','experience_years','city','bio','status'];
    protected $casts = ['experience_years' => 'integer'];

    public function user() { return $this->belongsTo(User::class); }
}
