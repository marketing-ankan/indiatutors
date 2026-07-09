<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class KycDocument extends Model {
    protected $fillable = ['user_id','type','original_name','path','status'];

    public function user() { return $this->belongsTo(User::class); }
}
