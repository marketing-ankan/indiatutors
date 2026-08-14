<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class WhatsappTestimonial extends Model {
    protected $fillable = ['name','text','time_label','is_published','position','created_by'];
    protected $casts = ['is_published' => 'boolean', 'position' => 'integer'];

    public function scopePublished($q) { return $q->where('is_published', true); }
}
