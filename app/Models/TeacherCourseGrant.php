<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * A course a member of staff has handed to a teacher.
 *
 * The counterpart to derived entitlement, not a replacement for it: a teacher
 * reads company material for the courses they are enrolled to teach UNION the
 * courses granted here. Nothing a student or parent can see is derived from
 * this table — see CourseMaterial::courseIdsFor.
 */
class TeacherCourseGrant extends Model
{
    protected $fillable = ['tutor_id', 'course_id', 'granted_by', 'note'];

    public function tutor()   { return $this->belongsTo(Tutor::class); }
    public function course()  { return $this->belongsTo(Course::class); }
    public function grantedBy() { return $this->belongsTo(User::class, 'granted_by'); }
}
