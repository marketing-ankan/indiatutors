<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class DemoRequest extends Model {
    protected $fillable = ['user_id','student_id','name','email','phone_country_code','phone','subject','grade','board','mode','city','country','timezone','message','whatsapp_consent','marketing_consent','course_id','status'];
    protected $casts = ['whatsapp_consent'=>'boolean','marketing_consent'=>'boolean'];

    public function user()    { return $this->belongsTo(User::class); }
    public function student() { return $this->belongsTo(Student::class); }
    public function course()  { return $this->belongsTo(Course::class); }
}
