<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Schema;

/**
 * One file, handed by one teacher to one learner — the second hop of the chain
 * and the row the admin trail reads.
 *
 * Access derived from this table is purely ADDITIVE. It widens what one named
 * learner may read and nothing else: the teacher and admin branches of
 * CourseMaterial::courseIdsFor never consult it, so handing a student a file
 * gives no other student, and no teacher, anything at all.
 */
class MaterialHandover extends Model
{
    protected $fillable = [
        'course_material_id', 'class_material_id', 'from_user_id', 'to_user_id',
        'student_id', 'enrollment_id', 'note',
        'first_viewed_at', 'downloaded_at', 'download_count',
    ];

    protected $casts = [
        'first_viewed_at' => 'datetime',
        'downloaded_at'   => 'datetime',
        'download_count'  => 'integer',
    ];

    public function courseMaterial() { return $this->belongsTo(CourseMaterial::class); }
    public function classMaterial()  { return $this->belongsTo(ClassMaterial::class); }
    public function sender()         { return $this->belongsTo(User::class, 'from_user_id'); }
    public function recipient()      { return $this->belongsTo(User::class, 'to_user_id'); }
    public function student()        { return $this->belongsTo(Student::class); }
    public function enrollment()     { return $this->belongsTo(Enrollment::class); }

    /**
     * Is the table there yet?
     *
     * deploy/deploy.sh ships app code before it runs `migrate` and tolerates
     * that migrate failing — App\Support\SchemaHealer explains why this host
     * works that way. Every read on a path that ALSO serves pre-existing
     * functionality (a learner's materials list, a download) must go through
     * this and degrade to the pre-feature answer, or an unapplied migration
     * turns two routes that worked yesterday into 500s. The previous run of
     * this feature shipped exactly that regression.
     *
     * Cached per request because a single materials page asks several times and
     * hasTable is a real schema query.
     */
    public static function ready(): bool
    {
        static $ready = null;

        return $ready ??= Schema::hasTable('material_handovers');
    }

    /**
     * Handovers this account is allowed to see.
     *
     * A student sees rows addressed to their own login OR naming their own
     * student profile; a guardian sees rows for any child they own. Both halves
     * matter — students.user_id is the GUARDIAN's login and
     * students.account_user_id is the student's own, so testing only one
     * silently hands a parent the files while the student's list stays empty.
     * Same idiom as EnrollmentController::ownsStudent.
     *
     * Teachers and admins get nothing from here on purpose: their entitlement is
     * the derived course rule, and this method must not widen it.
     */
    public static function visibleTo(User $user): ?Builder
    {
        if (! self::ready() || $user->isAdmin() || $user->isTeacher()) {
            return null;
        }

        $studentIds = $user->students()->pluck('id')->all();
        if ($user->isStudent() && $user->studentProfile) {
            $studentIds[] = $user->studentProfile->id;
        }
        $studentIds = array_values(array_unique($studentIds));

        return self::query()->where(function (Builder $q) use ($user, $studentIds) {
            $q->where('to_user_id', $user->id);
            if ($studentIds) {
                $q->orWhereIn('student_id', $studentIds);
            }
        });
    }

    /**
     * Course material ids this account may read because a teacher handed one
     * over — empty for every role whose access is derived, and empty while the
     * table is missing.
     *
     * @return array<int,int>
     */
    public static function courseMaterialIdsFor(User $user): array
    {
        $q = self::visibleTo($user);

        return $q
            ? $q->whereNotNull('course_material_id')->pluck('course_material_id')
                ->map(fn ($id) => (int) $id)->unique()->values()->all()
            : [];
    }

    /** Where a send actually lands: the learner's own login if they have one, else their guardian's. */
    public static function recipientUserId(Student $student): ?int
    {
        return $student->account_user_id ?: $student->user_id;
    }

    /** "sent" until someone opens it — never guessed, only read off the two stamps. */
    public function deliveryStatus(): string
    {
        if ($this->downloaded_at)   return 'downloaded';
        if ($this->first_viewed_at) return 'viewed';

        return 'sent';
    }
}
