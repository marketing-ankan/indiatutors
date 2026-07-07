<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class DemoRequest extends Model {
    protected $fillable = ['name','email','phone_country_code','phone','subject','grade','board','mode','city','country','timezone','message','whatsapp_consent','marketing_consent','course_id','status'];
    protected $casts = ['whatsapp_consent'=>'boolean','marketing_consent'=>'boolean'];
}
