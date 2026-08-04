<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TeachingOffering extends Model
{
    protected $fillable = [
        'profile_id', 'subject', 'grade_from', 'grade_to', 'boards', 'medium',
        'level', 'exam_target', 'fee_hourly', 'fee_monthly', 'experience_years', 'is_primary',
    ];

    protected $casts = [
        'boards'      => 'array',
        'grade_from'  => 'integer',
        'grade_to'    => 'integer',
        'is_primary'  => 'boolean',
        'fee_hourly'  => 'decimal:2',
        'fee_monthly' => 'decimal:2',
    ];

    public function profile() { return $this->belongsTo(PhysicalTeachingProfile::class, 'profile_id'); }

    // No coversGrade()/coversBoard() helpers here on purpose. Deciding whether
    // an offering fits a particular student is matching, and matching happens
    // in the leads-management software. This model's job is to store the range
    // faithfully and export it: a null bound means "no limit that side", and an
    // empty `boards` means board-agnostic — both documented in
    // docs/MATCHING-DATA-CONTRACT.md so the consumer interprets them correctly.
}
