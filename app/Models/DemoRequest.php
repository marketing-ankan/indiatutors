<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class DemoRequest extends Model {
    /** The five booking flows the public form offers. */
    public const TYPES = ['demo','group','workshop','free','physical'];

    protected $fillable = ['user_id','student_id','assigned_tutor_id','name','email','phone_country_code','phone','subject','grade','board','mode','city','country','timezone','message','whatsapp_consent','marketing_consent','course_id','status','type','scheduled_at'];
    protected $casts = ['whatsapp_consent'=>'boolean','marketing_consent'=>'boolean','scheduled_at'=>'datetime'];

    public function user()          { return $this->belongsTo(User::class); }
    public function student()       { return $this->belongsTo(Student::class); }
    public function course()        { return $this->belongsTo(Course::class); }
    public function assignedTutor() { return $this->belongsTo(Tutor::class, 'assigned_tutor_id'); }
    public function enrollment()    { return $this->hasOne(Enrollment::class); }
}
