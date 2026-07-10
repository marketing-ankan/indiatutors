<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class CurriculumItem extends Model {
    protected $fillable = ['enrollment_id','position','topic','details','status'];
    protected $casts = ['position' => 'integer'];

    public function enrollment() { return $this->belongsTo(Enrollment::class); }
}
