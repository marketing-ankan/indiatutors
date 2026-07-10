<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class ClassLog extends Model {
    protected $fillable = ['enrollment_id','tutor_id','topic','held_on','duration_min','homework','notes','status'];
    protected $casts = ['held_on' => 'date', 'duration_min' => 'integer'];

    public function enrollment() { return $this->belongsTo(Enrollment::class); }
    public function tutor()      { return $this->belongsTo(Tutor::class); }
}
