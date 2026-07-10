<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class RescheduleRequest extends Model {
    protected $fillable = ['enrollment_id','requested_by','preferred_date','reason','status'];
    protected $casts = ['preferred_date' => 'date'];

    public function enrollment() { return $this->belongsTo(Enrollment::class); }
    public function requester()  { return $this->belongsTo(User::class, 'requested_by'); }
}
