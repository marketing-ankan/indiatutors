<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Schema;

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
     * For a LEARNER entitlement is derived from live enrolments rather than
     * stored, so it can never drift from who is actually in the class:
     *   - a parent sees the courses their children are enrolled in;
     *   - a student sees their own;
     *   - an admin sees everything (null = no restriction).
     *
     * A TEACHER gets the courses they currently teach UNION the courses staff
     * have handed them (teacher_course_grants). Derived-only was backwards for
     * this one audience: a teacher prepares BEFORE they have students, and an
     * enrolment created from a free-text demo carries no course_id at all, so
     * the person the material is written for could be entitled to none of it.
     *
     * The grant widens the teacher branch and nothing else. Handing a teacher a
     * course gives their students nothing — the learner branch below never
     * consults that table.
     *
     * A teacher handing ONE FILE to ONE learner is deliberately not modelled
     * here: it grants no course, so it cannot be expressed as a course id. See
     * handedOverIdsFor below, which readableBy() adds on top.
     */
    public static function courseIdsFor(User $user): ?array
    {
        if ($user->isAdmin()) {
            return null;
        }

        $q = Enrollment::query()->where('status', 'active')->whereNotNull('course_id');

        if ($user->isTeacher() && $user->tutor) {
            return $q->where('tutor_id', $user->tutor->id)->pluck('course_id')
                ->concat(self::grantedCourseIds((int) $user->tutor->id))
                ->unique()->values()->all();
        }

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

        return $q->pluck('course_id')->unique()->values()->all();
    }

    /**
     * The ADDITIVE half of learner entitlement: material ids a teacher handed to
     * this account directly, on top of whatever courseIdsFor already allows.
     *
     * Kept as a separate method rather than folded into courseIdsFor because a
     * handover is per FILE, not per course — a teacher sending one deck must not
     * hand over the rest of the syllabus with it. Returns nothing for a teacher
     * or an admin, so this can only ever widen a learner's view.
     *
     * @return array<int,int>
     */
    public static function handedOverIdsFor(User $user): array
    {
        return MaterialHandover::courseMaterialIdsFor($user);
    }

    /**
     * May this account read this file — by course, or because it was handed over.
     *
     * The single test behind both the listing and the download, so a file that
     * appears in a learner's list can always be opened, and one that does not
     * can never be guessed at by id.
     */
    public function readableBy(User $user): bool
    {
        $courseIds = self::courseIdsFor($user);
        if ($courseIds === null || in_array($this->course_id, $courseIds, true)) {
            return true;
        }

        return in_array((int) $this->id, self::handedOverIdsFor($user), true);
    }

    /**
     * Granted course ids — or none at all while the table is still missing.
     *
     * deploy/deploy.sh ships app code before it runs `migrate`, and tolerates
     * that migrate failing or timing out (App\Support\SchemaHealer explains why
     * this host works that way). Without the check, that window turns every
     * teacher's materials page and every download into a 500 about an unknown
     * table — a hard regression on two routes that worked before grants existed.
     * With it a teacher simply sees what they saw before: the courses they are
     * enrolled to teach. The admin routes carry EnsureTeacherMaterialSchema, so
     * the first staff visit heals the table and the union returns.
     */
    private static function grantedCourseIds(int $tutorId): Collection
    {
        if (! Schema::hasTable('teacher_course_grants')) {
            return collect();
        }

        return TeacherCourseGrant::where('tutor_id', $tutorId)->pluck('course_id');
    }

    /**
     * Display size in whole kilobytes.
     *
     * Floored at 1 for a file that exists, because round() takes anything under
     * 512 bytes to zero and "0 KB" beside a real attachment reads as an upload
     * that failed. Null still means no file at all, which is the case the UI
     * drops from the row.
     */
    public function sizeKb(): ?int
    {
        return $this->size_bytes ? max(1, (int) round($this->size_bytes / 1024)) : null;
    }
}
