<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class VideoCourse extends Model {
    /** A recorded course is a product too, and needs the same stable code. */
    protected static function booted(): void
    {
        static::creating(function (VideoCourse $v) {
            if (! $v->sku) $v->sku = \App\Support\Sku::next(\App\Support\Sku::VIDEO);
        });
    }

    protected $guarded = [];
    protected $casts = ['price' => 'integer', 'position' => 'integer', 'is_published' => 'boolean'];

    public function lessons(): HasMany { return $this->hasMany(VideoLesson::class)->orderBy('position'); }
    public function entitlements(): HasMany { return $this->hasMany(VideoEntitlement::class); }

    public function scopePublished($q) { return $q->where('is_published', true); }

    /** Does this user own the course? (guests never do.) */
    public function ownedBy(?User $user): bool {
        return $user && $this->entitlements()->where('user_id', $user->id)->exists();
    }
}
