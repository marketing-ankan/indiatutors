<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Student extends Model {
    protected $fillable = ['user_id','account_user_id','code','name','grade','board','subjects','date_of_birth','notes'];
    protected $casts = ['date_of_birth' => 'date'];

    /** Codes are printed and emailed, so they are assigned once and never recomputed. */
    protected static function booted(): void {
        static::created(function (Student $s) {
            if (!$s->code) $s->forceFill(['code' => 'STU-' . (100000 + $s->id)])->saveQuietly();
        });
    }

    // user_id is the guardian who created the profile; account_user_id is the
    // student's own login, when they have been given one.
    public function user()    { return $this->belongsTo(User::class); }
    public function account() { return $this->belongsTo(User::class, 'account_user_id'); }
    public function enrollments() { return $this->hasMany(Enrollment::class); }
    public function portfolioItems() { return $this->hasMany(PortfolioItem::class)->latest('awarded_on')->latest('id'); }

    public function getSubjectsCountAttribute(): int {
        return count(array_filter(array_map('trim', explode(',', (string) $this->subjects))));
    }
}
