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
    public function curriculumItems() { return $this->hasMany(CurriculumItem::class)->orderBy('position'); }
    public function materials()      { return $this->hasMany(ClassMaterial::class)->latest(); }
    public function reschedules()    { return $this->hasMany(RescheduleRequest::class)->latest(); }
    /** The recurring weekly timetable — see EnrollmentSchedule. */
    public function schedules()      { return $this->hasMany(EnrollmentSchedule::class)->orderBy('weekday')->orderBy('start_time'); }
}
