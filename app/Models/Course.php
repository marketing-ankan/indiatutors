<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Course extends Model {
    protected $fillable = ['sku','name','slug','subtitle','short_description','description','age','pills','curriculum','regular_price','sale_price','image_url','is_featured','is_published','position'];
    protected $casts = ['pills'=>'array','curriculum'=>'array','regular_price'=>'decimal:2','sale_price'=>'decimal:2','is_featured'=>'boolean','is_published'=>'boolean'];

    public function categories(): BelongsToMany { return $this->belongsToMany(Category::class); }
    public function scopePublished($q) { return $q->where('is_published', true); }
    public function scopeFeatured($q) { return $q->where('is_featured', true); }
    public function getEffectivePriceAttribute(): float { return (float)($this->sale_price ?: $this->regular_price); }
    public function getOnSaleAttribute(): bool { return $this->sale_price !== null && $this->sale_price < $this->regular_price; }
}
