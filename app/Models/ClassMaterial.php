<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class ClassMaterial extends Model {
    protected $fillable = ['enrollment_id','tutor_id','type','title','original_name','path','link_url'];

    public function enrollment() { return $this->belongsTo(Enrollment::class); }
    public function tutor()      { return $this->belongsTo(Tutor::class); }
}
