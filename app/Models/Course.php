<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Course extends Model {
    protected $fillable = ['sku','name','slug','subtitle','short_description','description','age','pills','curriculum','curriculum_variants','regular_price','sale_price','image_url','is_featured','is_published','position'];
    protected $casts = ['pills'=>'array','curriculum'=>'array','curriculum_variants'=>'array','regular_price'=>'decimal:2','sale_price'=>'decimal:2','is_featured'=>'boolean','is_published'=>'boolean'];

    public function categories(): BelongsToMany { return $this->belongsToMany(Category::class); }
    public function reviews() { return $this->hasMany(Review::class); }
    public function approvedReviews() { return $this->hasMany(Review::class)->where('status', 'approved'); }
    public function scopePublished($q) { return $q->where('is_published', true); }
    public function scopeFeatured($q) { return $q->where('is_featured', true); }
    public function getEffectivePriceAttribute(): float { return (float)($this->sale_price ?: $this->regular_price); }
    public function getOnSaleAttribute(): bool { return $this->sale_price !== null && $this->sale_price < $this->regular_price; }

    /**
     * Cache-bust self-hosted images. The files live at stable paths
     * (/build/images/courses/{slug}.jpg), so when a photo is replaced the URL
     * would otherwise stay identical and browsers keep the stale cached copy
     * until a hard refresh. Appending ?v=<filemtime> changes the URL exactly
     * when the file changes — a git pull on the server rewrites mtime for
     * changed files only, so this also self-busts on every deploy.
     * External URLs (the old WordPress hotlinks) pass through untouched.
     */
    public function getImageUrlAttribute(?string $value): ?string
    {
        static $mtimes = [];
        if (!$value || !str_starts_with($value, '/build/')) return $value;
        if (!array_key_exists($value, $mtimes)) {
            $file = public_path(ltrim($value, '/'));
            $mtimes[$value] = is_file($file) ? filemtime($file) : null;
        }
        return $mtimes[$value] ? $value.'?v='.$mtimes[$value] : $value;
    }
}
