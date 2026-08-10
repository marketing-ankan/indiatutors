<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Company-supplied teaching material for a course (E3 + E4).
 *
 * One file, two audiences: the teacher teaches from it and every enrolled
 * student gets the same copy. Distinct from ClassMaterial, which is a teacher's
 * own upload against a single enrolment.
 */
class CourseMaterial extends Model
{
    public const TYPES = ['ppt', 'pdf', 'note', 'question_bank', 'other'];

    protected $fillable = [
        'course_id', 'uploaded_by', 'type', 'title', 'description',
        'path', 'original_name', 'link_url', 'size_bytes', 'is_published', 'position',
    ];

    protected $casts = [
        'is_published' => 'boolean',
        'position'     => 'integer',
        'size_bytes'   => 'integer',
    ];

    public function course()   { return $this->belongsTo(Course::class); }
    public function uploader() { return $this->belongsTo(User::class, 'uploaded_by'); }

    public function scopePublished($q) { return $q->where('is_published', true); }

    /**
     * Course ids this user may read material for.
     *
     * Entitlement is derived from live enrolments rather than stored, so it can
     * never drift from who is actually in the class:
     *   - a teacher sees the courses they currently teach;
     *   - a parent sees the courses their children are enrolled in;
     *   - a student sees their own;
     *   - an admin sees everything (null = no restriction).
     */
    public static function courseIdsFor(User $user): ?array
    {
        if ($user->isAdmin()) {
            return null;
        }

        $q = Enrollment::query()->where('status', 'active')->whereNotNull('course_id');

        if ($user->isTeacher() && $user->tutor) {
            $q->where('tutor_id', $user->tutor->id);
        } else {
            $studentIds = $user->students()->pluck('id')->all();
            // students.account_user_id is a student's OWN login; students.user_id
            // is their guardian. Querying the wrong one hands a student an empty
            // materials list while their parent sees the files.
            if ($user->isStudent() && $user->studentProfile) {
                $studentIds[] = $user->studentProfile->id;
            }
            if (! $studentIds) {
                return [];
            }
            $q->whereIn('student_id', array_unique($studentIds));
        }

        return $q->pluck('course_id')->unique()->values()->all();
    }
}
