<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppNotification;
use App\Models\AuditLog;
use App\Models\CourseMaterial;
use App\Models\Enrollment;
use App\Models\MaterialHandover;
use App\Models\Student;
use App\Support\SchemaHealer;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

/**
 * Hop two of the distribution chain: a teacher hands ONE file to ONE learner.
 *
 * Hop one — staff granting a teacher a course — is AdminTeacherMaterialController.
 * This is what the teacher does with it afterwards, and every route here is
 * bounded by the teacher's OWN active enrolments. That bound is the feature: a
 * teacher who can reach a student they do not teach can address a stranger's
 * child through a file-sharing screen, so the roster is rebuilt from enrolments
 * on every request rather than trusted from the ids the client posted.
 */
class MaterialHandoverController extends Controller
{
    /**
     * Students this teacher may send to.
     *
     * One row per STUDENT, not per enrolment: the ledger is keyed on who
     * receives the file, and a student taking two courses from the same teacher
     * is still one recipient. The enrolment shown is the one the send will
     * record, chosen the same way send() chooses it, so the two cannot disagree.
     */
    public function recipients(Request $request)
    {
        SchemaHealer::ensure(['material_handovers'], 'material_handovers', 'Material sharing');

        $tutor = $this->tutorFor($request);
        if (! $tutor) {
            return response()->json(['data' => [], 'material_id' => null]);
        }

        $materialId = $request->integer('material_id') ?: null;
        // already_sent is only a real answer about a real file. Asked without
        // one, there is no question to answer and every row reports false.
        $sentTo = $materialId
            ? MaterialHandover::where('course_material_id', $materialId)->pluck('student_id')
                ->filter()->map(fn ($id) => (int) $id)->all()
            : [];

        $rows = $this->rosterFor($tutor->id)
            ->map(function (array $entry) use ($sentTo) {
                /** @var Student $student */
                $student    = $entry['student'];
                $enrollment = $entry['enrollment'];

                return [
                    'student_id'    => (int) $student->id,
                    'name'          => $student->name,
                    'enrollment_id' => (int) $enrollment->id,
                    'course'        => $enrollment->course?->name,
                    // The login the file will actually land on. Null only if the
                    // profile has neither a guardian nor an account, which the
                    // send endpoint reports as a skip rather than silently dropping.
                    'user_id'       => MaterialHandover::recipientUserId($student),
                    // False means the file goes to the guardian's account and
                    // nobody else — the UI has to say so, because "sent to Ravi"
                    // would not be true.
                    'has_own_login' => (bool) $student->account_user_id,
                    'already_sent'  => in_array((int) $student->id, $sentTo, true),
                ];
            })->values()->all();

        return response()->json(['data' => $rows, 'material_id' => $materialId]);
    }

    /**
     * Send a company file to named students.
     *
     * Two authorisation gates, both mandatory. The teacher must be entitled to
     * the file themselves — a granted or taught course, exactly the rule their
     * own materials list uses — and every student must sit on one of their own
     * active enrolments. An unowned student id fails the WHOLE request rather
     * than being filtered out, because a request naming someone else's child is
     * not a partially valid request.
     */
    public function send(Request $request, CourseMaterial $material)
    {
        SchemaHealer::ensure(['material_handovers'], 'material_handovers', 'Material sharing');

        $tutor = $this->tutorFor($request);
        $user  = $request->user();

        // A teacher account with no directory row has no roster, so there is no
        // student this send could legitimately reach. recipients() and
        // handovers() already return empty for the same state; this one has to
        // refuse rather than dereference a null tutor.
        abort_unless($tutor, 403, 'Your teaching profile is not set up yet.');

        $data = $request->validate([
            'student_ids'   => 'required|array|min:1|max:100',
            'student_ids.*' => 'integer',
            'note'          => 'nullable|string|max:300',
        ]);

        $courseIds = CourseMaterial::courseIdsFor($user);
        abort_unless(is_array($courseIds) && in_array($material->course_id, $courseIds, true),
            403, 'This material is for a course you do not teach.');
        // A teacher forwarding a deck staff have not released would put a
        // half-finished file in front of a family. Staging exists to prevent it.
        abort_unless($material->is_published, 422, 'This material has not been released yet.');

        $roster  = $this->rosterFor($tutor->id)->keyBy(fn (array $e) => (int) $e['student']->id);
        $wanted  = array_values(array_unique(array_map('intval', $data['student_ids'])));
        $unknown = array_values(array_diff($wanted, $roster->keys()->all()));
        abort_if($unknown !== [], 403, 'One or more of those students are not in your classes.');

        $note    = $data['note'] ?? null;
        $sent    = 0;
        $skipped = [];

        foreach ($wanted as $studentId) {
            $entry      = $roster[$studentId];
            $student    = $entry['student'];
            $enrollment = $entry['enrollment'];

            $toUserId = MaterialHandover::recipientUserId($student);
            if (! $toUserId) {
                $skipped[] = ['student_id' => $studentId, 'reason' => 'This student has no login to send to yet.'];
                continue;
            }

            $existing = MaterialHandover::where('course_material_id', $material->id)
                ->where('to_user_id', $toUserId)->first();

            // Re-sending is the same statement, not a second event: the ledger
            // exists to answer "does this learner have this file", and a second
            // row makes that unanswerable. Update the note and move on.
            if ($existing && (int) $existing->student_id === $studentId) {
                $existing->update(['note' => $note, 'enrollment_id' => $enrollment->id]);
                $sent++;
                continue;
            }

            // A row already addressed to this login for a DIFFERENT child. Two
            // siblings with no logins of their own share one guardian account,
            // and unique(course_material_id, to_user_id) allows the pair only
            // one row. Overwriting would erase the first child's record, so this
            // is reported rather than forced — the guardian can already open the
            // file, and the trail keeps saying which child it was sent for.
            if ($existing) {
                $skipped[] = [
                    'student_id' => $studentId,
                    'reason'     => 'Already sent to this family\'s account for '
                        . ($existing->student?->name ?? 'another student')
                        . ' — one login can hold one copy of a file.',
                ];
                continue;
            }

            try {
                $handover = MaterialHandover::create([
                    'course_material_id' => $material->id,
                    'from_user_id'       => $user->id,
                    'to_user_id'         => $toUserId,
                    'student_id'         => $studentId,
                    'enrollment_id'      => $enrollment->id,
                    'note'               => $note,
                ]);
            } catch (QueryException $e) {
                // The unique index is the authority; the check above cannot see
                // a row another request wrote a millisecond ago.
                $raced = MaterialHandover::where('course_material_id', $material->id)
                    ->where('to_user_id', $toUserId)->first();
                if (! $raced) {
                    throw $e;
                }
                $skipped[] = ['student_id' => $studentId, 'reason' => 'Already sent to this student.'];
                continue;
            }

            $this->notifyBothLogins($student, $material->title, $user->name);

            AuditLog::record('material_sent_to_student', 'course_material', $material->id, $material->title, [
                'student'    => $student->name,
                'course'     => $enrollment->course?->name,
                'teacher'    => $user->name,
                'handover_id'=> $handover->id,
            ]);

            $sent++;
        }

        return response()->json(['data' => ['sent' => $sent, 'skipped' => $skipped]], 201);
    }

    /**
     * Who has this file, and what have they done with it.
     *
     * Scoped to this teacher's own students rather than to their own sends: the
     * question the modal asks is "does this student already have it", and a
     * colleague who teaches the same child having sent it first is a yes. sent_by
     * carries who it was, so the answer is never mistaken for the reader's own act.
     */
    public function handovers(Request $request, CourseMaterial $material)
    {
        SchemaHealer::ensure(['material_handovers'], 'material_handovers', 'Material sharing');

        $tutor = $this->tutorFor($request);
        $courseIds = CourseMaterial::courseIdsFor($request->user());
        abort_unless(is_array($courseIds) && in_array($material->course_id, $courseIds, true),
            403, 'This material is for a course you do not teach.');

        $studentIds = $tutor ? $this->rosterFor($tutor->id)->keys()->all() : [];

        $rows = MaterialHandover::query()
            ->where('course_material_id', $material->id)
            ->where(function ($q) use ($studentIds, $request) {
                $q->where('from_user_id', $request->user()->id);
                if ($studentIds) {
                    $q->orWhereIn('student_id', $studentIds);
                }
            })
            ->with(['student:id,name', 'sender:id,name'])
            ->orderByDesc('created_at')->orderByDesc('id')
            ->get()
            ->map(fn (MaterialHandover $h) => [
                'id'              => $h->id,
                'student'         => $h->student?->name,
                'sent_by'         => $h->sender?->name,
                'sent_at'         => optional($h->created_at)->toDateString(),
                'first_viewed_at' => optional($h->first_viewed_at)->toDateString(),
                'downloaded_at'   => optional($h->downloaded_at)->toDateString(),
                'download_count'  => (int) $h->download_count,
                'status'          => $h->deliveryStatus(),
                'note'            => $h->note,
            ])->values()->all();

        return response()->json(['data' => $rows]);
    }

    // ---- Learner -------------------------------------------------------------

    /**
     * Stamp "opened" — once, and only for the learner it is a claim about.
     *
     * A guardian may call this: they can legitimately open their child's file,
     * and refusing would 403 the parent screen. But first_viewed_at is the
     * answer to "has the LEARNER opened it", shown on that same parent screen,
     * so a parent's click must not write it. Anything else would have the
     * console reporting a child opened a deck they have never seen.
     */
    public function markSeen(Request $request, MaterialHandover $handover)
    {
        $user = $request->user();
        $isRecipient = (int) $handover->to_user_id === (int) $user->id;
        abort_unless($isRecipient || $this->ownsStudent($handover->student, $user), 403, 'Not your material.');

        if ($isRecipient && ! $handover->first_viewed_at) {
            $handover->forceFill(['first_viewed_at' => now()])->save();
        }

        return response()->json(['data' => [
            'id'              => $handover->id,
            'first_viewed_at' => optional($handover->first_viewed_at)->toDateTimeString(),
            'status'          => $handover->deliveryStatus(),
        ]]);
    }

    // ---- Shared --------------------------------------------------------------

    /**
     * The teacher's own students, one entry per student.
     *
     * Rebuilt from active enrolments on every request — this is the only thing
     * standing between a teacher and a student they do not teach, so it is never
     * cached and never taken from the request. Where a student has two active
     * enrolments with this teacher the one carrying a course is preferred, since
     * an enrolment created from a free-text demo has course_id = NULL and would
     * otherwise attach the handover to a class with no course at all.
     *
     * @return Collection<int,array{student:Student,enrollment:Enrollment}>
     */
    private function rosterFor(int $tutorId): Collection
    {
        return Enrollment::query()
            ->where('tutor_id', $tutorId)
            ->where('status', 'active')
            ->whereNotNull('student_id')
            ->with(['student', 'course:id,name'])
            ->orderBy('id')
            ->get()
            ->filter(fn (Enrollment $e) => (bool) $e->student)
            ->reduce(function (Collection $carry, Enrollment $e) {
                $key  = (int) $e->student_id;
                $held = $carry[$key] ?? null;
                if (! $held || (! $held['enrollment']->course_id && $e->course_id)) {
                    $carry[$key] = ['student' => $e->student, 'enrollment' => $e];
                }

                return $carry;
            }, collect());
    }

    private function tutorFor(Request $request)
    {
        abort_unless($request->user()->isTeacher(), 403, 'Teacher accounts only.');

        return $request->user()->tutor;
    }

    /**
     * A student profile is reachable by the guardian who owns it and by the
     * student's own account, when one has been linked. The explicit null check
     * keeps an unlinked profile (account_user_id = null) from ever matching.
     * Same test as EnrollmentController::ownsStudent.
     */
    private function ownsStudent($student, $user): bool
    {
        if (! $student) return false;
        if ((int) $student->user_id === (int) $user->id) return true;

        return $student->account_user_id !== null && (int) $student->account_user_id === (int) $user->id;
    }

    /**
     * Tell the guardian AND the student's own account.
     *
     * Notifying one login only is how a student with their own account never
     * learns their teacher shared something — the bug this feature also fixes in
     * TeacherController::storeMaterial. The two can be the same id, or the
     * second can be absent, so the list is deduplicated and nulls dropped.
     */
    private function notifyBothLogins(Student $student, string $title, ?string $teacher): void
    {
        $ids = array_values(array_unique(array_filter([$student->user_id, $student->account_user_id])));

        foreach ($ids as $id) {
            AppNotification::send(
                $id,
                'material_shared',
                'New material from your teacher',
                "\"{$title}\" was shared" . ($teacher ? " by {$teacher}" : '')
                    . ' for ' . ($student->name ?? 'your student') . '.',
            );
        }
    }
}
