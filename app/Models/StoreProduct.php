<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StoreProduct extends Model {
    protected $guarded = [];
    protected $casts = ['price' => 'integer', 'position' => 'integer', 'is_published' => 'boolean'];

    public function scopePublished($q) { return $q->where('is_published', true); }
}
