<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VideoEntitlement extends Model {
    protected $guarded = [];
    protected $casts = ['granted_at' => 'datetime'];
}
