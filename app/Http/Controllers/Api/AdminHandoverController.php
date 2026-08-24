<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\MaterialHandover;
use App\Models\TeacherCourseGrant;
use App\Models\Tutor;
use App\Support\SchemaHealer;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

/**
 * The whole distribution chain in one reverse-chronological ledger.
 *
 * Owner: "this whole transfer of material should be tracked down also through
 * the admin panel." Two hops, two tables — staff granting a teacher a course,
 * and a teacher handing one file to one learner — merged here because an admin
 * asking "where did the Term 1 deck go" should not have to read two screens and
 * interleave them by eye.
 *
 * Merged in PHP rather than by the database because the two hops share no
 * columns worth a UNION: a grant has no file and no student, a send has both.
 * Same hand-built pagination as AdminTeacherController::index, and the same
 * reason — staff-scale volume, tens of rows, not thousands.
 *
 * Every figure is counted from rows that exist. There is no estimate here and no
 * placeholder: a send nobody has opened reports status "sent", which is the true
 * answer, not a gap to be filled in.
 */
class AdminHandoverController extends Controller
{
    private const PER_PAGE = 20;

    public function index(Request $request)
    {
        // Both tables ship with this feature and this host's deploy can serve app
        // code before `migrate` lands. An honest 503 beats a stack trace about an
        // unknown table — see App\Support\SchemaHealer.
        SchemaHealer::ensure(
            ['teacher_course_grants', 'material_handovers'],
            'material_handovers',
            'The handover trail',
        );

        $stage     = $request->string('stage')->toString();
        $search    = trim($request->string('q')->toString());
        $month     = $request->string('month')->toString();
        $teacherId = $request->integer('teacher_id') ?: null;

        $rows = $this->grants()->concat($this->sends())
            ->when($teacherId !== null, fn (Collection $c) => $c->where('teacher_id', $teacherId))
            ->when(preg_match('/^\d{4}-\d{2}$/', $month) === 1,
                fn (Collection $c) => $c->filter(fn ($r) => str_starts_with((string) $r['at'], $month)))
            ->when($search !== '', fn (Collection $c) => $c->filter(fn ($r) => str_contains(
                mb_strtolower(implode(' ', array_filter([
                    $r['actor'], $r['teacher'], $r['course'], $r['material'], $r['student'], $r['note'],
                ]))),
                mb_strtolower($search),
            )))
            ->sortByDesc('at')->values();

        // Totals are taken BEFORE the stage filter, so the two stage chips can
        // carry counts that match what selecting them returns. Counted from the
        // same rows the table is built from — a chip reading "Sends 3" cannot
        // select 2.
        $totals = [
            'grants'     => $rows->where('stage', 'grant')->count(),
            'sends'      => $rows->where('stage', 'send')->count(),
            'viewed'     => $rows->where('status', 'viewed')->count(),
            'downloaded' => $rows->where('status', 'downloaded')->count(),
        ];

        // Real months, from real rows — so the chip row cannot offer a month
        // with nothing behind it.
        $months = $rows->map(fn ($r) => mb_substr((string) $r['at'], 0, 7))
            ->filter()->unique()->sortDesc()->values()->all();

        if (in_array($stage, ['grant', 'send'], true)) {
            $rows = $rows->where('stage', $stage)->values();
        }

        $page = max(1, (int) $request->integer('page', 1));
        $paginator = new LengthAwarePaginator(
            $rows->forPage($page, self::PER_PAGE)->values(),
            $rows->count(),
            self::PER_PAGE,
            $page,
            ['path' => $request->url(), 'query' => $request->query()],
        );

        return response()->json([
            'data'   => $paginator->items(),
            'meta'   => [
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
                'total'        => $paginator->total(),
                'per_page'     => self::PER_PAGE,
            ],
            'totals' => $totals,
            'months' => $months,
        ]);
    }

    /**
     * Revoke a send.
     *
     * This genuinely withdraws access: the learner's entitlement to a
     * handed-over file IS this row, so deleting it takes the file off their
     * list — unless they are separately enrolled on the course, in which case
     * they keep it through the derived rule and always would have. The confirm
     * text in the console says so.
     */
    public function destroy(MaterialHandover $handover)
    {
        $material = $handover->courseMaterial;
        $student  = $handover->student;
        $sender   = $handover->sender;
        $handover->delete();

        AuditLog::record('material_handover_revoked', 'course_material',
            $material?->id, $material?->title, [
                'student' => $student?->name,
                'teacher' => $sender?->name,
            ]);

        return response()->json(['message' => 'Handover revoked'
            . ($student?->name ? ' for ' . $student->name : '') . '.']);
    }

    // ---- The two hops --------------------------------------------------------

    /** Hop one: staff handed a teacher a course. */
    private function grants(): Collection
    {
        return TeacherCourseGrant::query()
            ->with(['tutor:id,name,user_id', 'course:id,name', 'grantedBy:id,name'])
            ->get()
            ->map(fn (TeacherCourseGrant $g) => [
                'stage'      => 'grant',
                'id'         => $g->id,
                'at'         => optional($g->created_at)->toDateTimeString(),
                'actor'      => $g->grantedBy?->name ?? 'system',
                'teacher'    => $g->tutor?->name,
                'teacher_id' => (int) $g->tutor_id,
                'course'     => $g->course?->name,
                'material'   => null,       // a grant hands over a course, not a file
                'student'    => null,
                'status'     => 'granted',
                'note'       => $g->note,
                // Present and null so both hops share one row shape — a grant
                // has no delivery state to report, which is not the same as one
                // that has not been read yet.
                'sent_at'    => optional($g->created_at)->toDateString(),
                'opened_at'  => null,
                'downloads'  => null,
            ]);
    }

    /** Hop two: a teacher handed one file to one learner. */
    private function sends(): Collection
    {
        // from_user_id is the teacher's LOGIN; teacher_id filters and the grant
        // rows above are keyed on the TUTOR. Resolved once here rather than per
        // row, so filtering by a teacher catches both of their hops.
        $tutorsByUser = Tutor::query()->whereNotNull('user_id')
            ->get(['id', 'name', 'user_id'])->keyBy('user_id');

        return MaterialHandover::query()
            ->with([
                'courseMaterial:id,title,course_id', 'courseMaterial.course:id,name',
                'sender:id,name', 'student:id,name', 'enrollment:id,course_id', 'enrollment.course:id,name',
            ])
            ->get()
            ->map(function (MaterialHandover $h) use ($tutorsByUser) {
                $tutor = $h->from_user_id ? $tutorsByUser->get($h->from_user_id) : null;

                return [
                    'stage'      => 'send',
                    'id'         => $h->id,
                    'at'         => optional($h->created_at)->toDateTimeString(),
                    'actor'      => $h->sender?->name ?? 'system',
                    // The teacher's directory name where they have one, else the
                    // login's name. Never blank while a sender exists.
                    'teacher'    => $tutor?->name ?? $h->sender?->name,
                    'teacher_id' => $tutor ? (int) $tutor->id : null,
                    'course'     => $h->courseMaterial?->course?->name ?? $h->enrollment?->course?->name,
                    'material'   => $h->courseMaterial?->title,
                    'student'    => $h->student?->name,
                    'status'     => $h->deliveryStatus(),
                    'note'       => $h->note,
                    'sent_at'    => optional($h->created_at)->toDateString(),
                    'opened_at'  => optional($h->first_viewed_at)->toDateTimeString(),
                    'downloads'  => (int) $h->download_count,
                ];
            });
    }
}
