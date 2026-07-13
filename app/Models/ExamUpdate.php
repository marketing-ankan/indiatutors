<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class ExamUpdate extends Model {
    protected $fillable = ['title','body','exam_date','link_url','is_published','created_by'];
    protected $casts = ['exam_date' => 'date', 'is_published' => 'boolean'];

    public function scopePublished($q) { return $q->where('is_published', true); }
}
