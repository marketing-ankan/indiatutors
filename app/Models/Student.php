<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Student extends Model {
    protected $fillable = ['user_id','name','grade','board','subjects','date_of_birth','notes'];
    protected $casts = ['date_of_birth' => 'date'];

    public function user() { return $this->belongsTo(User::class); }
    public function enrollments() { return $this->hasMany(Enrollment::class); }
}
