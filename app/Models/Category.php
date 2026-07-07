<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model {
    protected $fillable = ['name','slug','parent_id','image_url','description','position'];

    public function parent(): BelongsTo { return $this->belongsTo(Category::class, 'parent_id'); }
    public function children(): HasMany { return $this->hasMany(Category::class, 'parent_id')->orderBy('position')->orderBy('name'); }
    public function courses(): BelongsToMany { return $this->belongsToMany(Course::class); }
    public function scopeRoots($query) { return $query->whereNull('parent_id'); }
}
