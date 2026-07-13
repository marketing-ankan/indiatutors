<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class PortfolioItem extends Model {
    protected $fillable = ['student_id','added_by','type','title','description','awarded_on','link_url','original_name','path'];
    protected $casts = ['awarded_on' => 'date'];

    public function student() { return $this->belongsTo(Student::class); }
    public function author()  { return $this->belongsTo(User::class, 'added_by'); }
}
