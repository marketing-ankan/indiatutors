<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Student;
use App\Models\StudentAchievement;
use App\Models\Tutor;
use Illuminate\Http\Request;

/**
 * E7 — achievements a family records and credits.
 *
 * Public submission + staff moderation in one file, the way ReviewController
 * pairs its public store() with its admin methods.
 *
 * Nothing a family writes appears publicly on submission: it lands `pending`,
 * an admin approves it, AND the family must have ticked publish-consent. Both,
 * not either.
 */
class StudentAchievementController extends Controller
{
    // ---- The family's own record -------------------------------------------

    /** Achievements for a student this account owns, in any status. */
    public function index(Request $request)
    {
        $ids = self::ownedStudentIds($request);

        return response()->json(['data' =>
            StudentAchievement::with(['tutor:id,name,slug', 'student:id,name'])
                ->whereIn('student_id', $ids)
                ->latest()
                ->get()
                ->map(fn (StudentAchievement $a) => self::owner($a))
                ->all(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'student_id'     => 'required|integer',
            'title'          => 'required|string|max:200',
            'body'           => 'nullable|string|max:2000',
            'achieved_on'    => 'nullable|date|before_or_equal:today',
            'tutor_id'       => 'nullable|integer|exists:tutors,id',
            'consent_public' => 'nullable|boolean',
            'consent_name'   => 'nullable|boolean',
        ]);

        abort_unless(in_array((int) $data['student_id'], self::ownedStudentIds($request), true),
            403, 'That student is not on your account.');

        // A tutor may only be credited if this student actually learned with
        // them. Otherwise the field is an open channel for attaching any
        // teacher's name to any claim — and these get published.
        if (! empty($data['tutor_id']) && ! self::taughtBy((int) $data['student_id'], (int) $data['tutor_id'])) {
            return response()->json([
                'message' => 'You can only credit a teacher your child has actually had classes with.',
            ], 422);
        }

        // consent_name is meaningless without consent_public, and storing it as
        // true alongside "do not publish" invites a later reader to treat the
        // name as cleared.
        $public = (bool) ($data['consent_public'] ?? false);

        $achievement = StudentAchievement::create([
            'student_id'     => $data['student_id'],
            'submitted_by'   => $request->user()->id,
            'tutor_id'       => $data['tutor_id'] ?? null,
            'title'          => $data['title'],
            'body'           => $data['body'] ?? null,
            'achieved_on'    => $data['achieved_on'] ?? null,
            'consent_public' => $public,
            'consent_name'   => $public && (bool) ($data['consent_name'] ?? false),
            'status'         => 'pending',
        ]);

        return response()->json([
            'message' => $public
                ? 'Thank you! We may share this once our team has reviewed it.'
                : 'Saved to your profile. We will not share it publicly.',
            'data' => self::owner($achievement->fresh(['tutor', 'student'])),
        ], 201);
    }

    /** Withdraw consent, or delete outright. A family may always change its mind. */
    public function update(Request $request, StudentAchievement $achievement)
    {
        abort_unless(in_array($achievement->student_id, self::ownedStudentIds($request), true), 403);

        $data = $request->validate([
            'consent_public' => 'nullable|boolean',
            'consent_name'   => 'nullable|boolean',
        ]);

        $public = array_key_exists('consent_public', $data) ? (bool) $data['consent_public'] : $achievement->consent_public;
        $achievement->update([
            'consent_public' => $public,
            'consent_name'   => $public && (bool) ($data['consent_name'] ?? $achievement->consent_name),
        ]);

        return response()->json(['data' => self::owner($achievement->fresh(['tutor', 'student']))]);
    }

    public function destroy(Request $request, StudentAchievement $achievement)
    {
        abort_unless(in_array($achievement->student_id, self::ownedStudentIds($request), true), 403);
        $achievement->delete();
        return response()->json(['message' => 'Removed.']);
    }

    /**
     * E6 — "my learning so far", one block per student on the account.
     *
     * Lives beside achievements because both answer "what has this student
     * done", and both are scoped by the same ownership rule.
     */
    public function record(Request $request)
    {
        $students = Student::whereIn('id', self::ownedStudentIds($request))->orderBy('name')->get();

        return response()->json([
            'data' => $students->map(fn (Student $s) => \App\Support\StudentRecord::forStudent($s))->all(),
        ]);
    }

    // ---- Staff moderation ---------------------------------------------------

    public function adminIndex(Request $request)
    {
        $q = StudentAchievement::with(['tutor:id,name,slug', 'student:id,name', 'submitter:id,name,email'])->latest();
        if ($s = $request->string('status')->toString()) $q->where('status', $s);

        return response()->json(['data' => $q->limit(100)->get()->map(fn ($a) => [
            'id'             => $a->id,
            'title'          => $a->title,
            'body'           => $a->body,
            'achieved_on'    => optional($a->achieved_on)->toDateString(),
            'student'        => $a->student?->name,
            'submitted_by'   => $a->submitter?->only(['name', 'email']),
            'tutor'          => $a->tutor?->only(['id', 'name', 'slug']),
            'consent_public' => $a->consent_public,
            'consent_name'   => $a->consent_name,
            'status'         => $a->status,
            'staff_note'     => $a->staff_note,
            // Spelled out so a moderator is never guessing why an approved item
            // is still not on the site.
            'publishable'    => $a->status === 'approved' && $a->consent_public,
            'created_at'     => optional($a->created_at)->toDateString(),
        ])->all()]);
    }

    public function adminUpdate(Request $request, StudentAchievement $achievement)
    {
        $data = $request->validate([
            'status'     => 'required|in:' . implode(',', StudentAchievement::STATUSES),
            'staff_note' => 'nullable|string|max:300',
        ]);

        // Staff may approve, reject and annotate. They may NOT grant consent —
        // that is the family's to give, and an approval flow that could set it
        // would make the consent column worthless as evidence.
        $achievement->update($data);

        AuditLog::record('achievement_' . $data['status'], 'student_achievement', $achievement->id,
            $achievement->title, ['consent_public' => $achievement->consent_public]);

        return response()->json(['message' => 'Updated.', 'data' => ['id' => $achievement->id, 'status' => $achievement->status]]);
    }

    // ---- helpers ------------------------------------------------------------

    /** Students this account may speak for: their own children, or themselves. */
    private static function ownedStudentIds(Request $request): array
    {
        $user = $request->user();
        $ids  = $user->students()->pluck('id')->all();

        // A student-role account speaks for its own linked student record.
        if ($user->isStudent()) {
            $own = Student::where('user_id', $user->id)->pluck('id')->all();
            $ids = array_values(array_unique(array_merge($ids, $own)));
        }
        return array_map('intval', $ids);
    }

    /** Has this student ever had a class or a held demo with this teacher? */
    private static function taughtBy(int $studentId, int $tutorId): bool
    {
        return \App\Models\Enrollment::where('student_id', $studentId)->where('tutor_id', $tutorId)->exists()
            || \App\Models\DemoRequest::where('student_id', $studentId)
                ->held()
                ->whereRaw(\App\Support\TeacherPerformance::CREDITED . ' = ?', [$tutorId])
                ->exists();
    }

    private static function owner(StudentAchievement $a): array
    {
        return [
            'id'             => $a->id,
            'title'          => $a->title,
            'body'           => $a->body,
            'achieved_on'    => optional($a->achieved_on)->toDateString(),
            'student'        => $a->student?->name,
            'student_id'     => $a->student_id,
            'tutor'          => $a->tutor?->only(['id', 'name', 'slug']),
            'consent_public' => $a->consent_public,
            'consent_name'   => $a->consent_name,
            'status'         => $a->status,
            'shown_publicly' => $a->status === 'approved' && $a->consent_public,
            'created_at'     => optional($a->created_at)->toDateString(),
        ];
    }
}
