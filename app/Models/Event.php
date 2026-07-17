<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Event extends Model {
    protected $guarded = [];
    protected $casts = ['starts_at' => 'datetime', 'ends_at' => 'datetime'];

    public function scopePublished($q) { return $q->where('status', '!=', 'draft'); }
}
