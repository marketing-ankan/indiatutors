<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Enrollment extends Model {
    protected $fillable = ['student_id','tutor_id','course_id','demo_request_id','plan','status','notes'];

    public function student() { return $this->belongsTo(Student::class); }
    public function tutor()   { return $this->belongsTo(Tutor::class); }
    public function course()  { return $this->belongsTo(Course::class); }
    public function demoRequest() { return $this->belongsTo(DemoRequest::class); }
    public function classLogs()   { return $this->hasMany(ClassLog::class)->latest('held_on'); }
}
