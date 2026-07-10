<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Tutor extends Model {
    protected $fillable = [
        'user_id','name','slug','tagline','qualification','experience_years','subjects',
        'fee_hourly','fee_trial','city','state','localities','languages',
        'teaching_mode','verified','is_published','bio','image_url','position',
    ];

    protected $casts = [
        'experience_years' => 'integer',
        'fee_hourly'       => 'decimal:2',
        'fee_trial'        => 'decimal:2',
        'verified'         => 'boolean',
        'is_published'     => 'boolean',
        'position'         => 'integer',
    ];

    public function scopePublished($q) { return $q->where('is_published', true); }

    public function user()          { return $this->belongsTo(User::class); }
    public function enrollments()   { return $this->hasMany(Enrollment::class); }
    public function assignedDemos() { return $this->hasMany(DemoRequest::class, 'assigned_tutor_id'); }

    // Turn comma strings into clean arrays for the API
    public function getSubjectsListAttribute(): array {
        return $this->splitCsv($this->subjects);
    }
    public function getLanguagesListAttribute(): array {
        return $this->splitCsv($this->languages);
    }
    public function getLocalitiesListAttribute(): array {
        return $this->splitCsv($this->localities);
    }

    private function splitCsv(?string $v): array {
        if (!$v) return [];
        return array_values(array_filter(array_map('trim', explode(',', $v))));
    }
}
