<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * A level/batch of a group class — "Beginner, Sat–Sun 10:00–11:00, IST".
 *
 * Days, time and timezone are separate columns because the source data fused
 * them into one string, which cannot be sorted, filtered or translated.
 * `seats_total` is nullable and unset by default: the old per-level "N students"
 * figures were invented, and nothing links a batch to enrolments yet, so there
 * is no honest number to show until either the owner types one or that link
 * exists.
 */
class CourseBatch extends Model
{
    protected $fillable = ['course_id', 'name', 'schedule_days', 'schedule_time', 'timezone', 'seats_total', 'position'];

    public function course() { return $this->belongsTo(Course::class); }
}
