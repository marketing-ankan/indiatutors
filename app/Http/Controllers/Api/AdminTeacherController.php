<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\TeacherApplication;
use App\Models\TeacherProfile;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

// The console's Teachers tab has one list, but the platform has two tables
// behind it:
//
//   teacher_profiles      — a teacher who already has an account, filled in
//                           from their own dashboard.
//   teacher_applications  — the public "Become a Teacher" form. No account, no
//                           user_id, and until now no UI at all: submissions
//                           were only reachable through the raw API.
//
// Merging them here (de-duplicated by email, so a teacher who applied and then
// registered appears once) gives staff a single queue. Each row carries `kind`
// so the UI can offer only the actions that row actually supports, rather than
// showing six buttons of which three are dead.
class AdminTeacherController extends Controller
{
    public function index(Request $request)
    {
        $status = $request->string('status')->toString();
        $search = trim($request->string('q')->toString());

        $profiles = TeacherProfile::query()
            ->with(['user:id,name,email', 'user.tutor:id,user_id,slug,is_published'])
            ->get()
            ->map(fn (TeacherProfile $p) => [
                'kind'       => 'profile',
                'id'         => $p->id,
                'user_id'    => $p->user_id,
                'name'       => $p->user?->name ?? 'Teacher',
                'email'      => $p->user?->email,
                'subjects'   => $this->toList($p->subjects),
                'headline'   => $p->headline,
                'city'       => $p->city,
                'status'     => $p->status,
                'is_listed'  => (bool) $p->user?->tutor?->is_published,
                'tutor_slug' => $p->user?->tutor?->slug,
                'has_cv'     => false,
                'video_url'  => null,
                'updated_at' => $p->updated_at,
            ]);

        // Only applications with no matching account — once they have one, the
        // profile row above is the authoritative record.
        $claimed = $profiles->pluck('email')->filter()->map(fn ($e) => mb_strtolower($e))->all();

        $applications = TeacherApplication::query()->get()
            ->reject(fn (TeacherApplication $a) => in_array(mb_strtolower($a->email), $claimed, true))
            ->map(fn (TeacherApplication $a) => [
                'kind'       => 'application',
                'id'         => $a->id,
                'user_id'    => null,
                'name'       => $a->name,
                'email'      => $a->email,
                'subjects'   => $this->toList($a->subjects),
                'headline'   => null,
                'city'       => $a->city,
                'status'     => $a->status,
                'is_listed'  => false,
                'tutor_slug' => null,
                'has_cv'     => (bool) $a->cv_path,
                'video_url'  => $a->video_url,
                'updated_at' => $a->updated_at,
            ]);

        $rows = $profiles->concat($applications)
            ->when($status !== '', fn (Collection $c) => $c->where('status', $status))
            ->when($search !== '', fn (Collection $c) => $c->filter(fn ($r) => str_contains(mb_strtolower(
                $r['name'] . ' ' . $r['email'] . ' ' . implode(' ', $r['subjects'])
            ), mb_strtolower($search))))
            ->sortByDesc('updated_at')
            ->values()
            ->map(fn ($r) => array_merge($r, ['updated_at' => optional($r['updated_at'])->toDateString()]));

        $perPage = 20;
        $page    = max(1, (int) $request->integer('page', 1));

        // Hand-built because the two sources cannot be paginated by the database
        // as one query. The volume here is staff-scale (tens, not thousands).
        $paginator = new LengthAwarePaginator(
            $rows->forPage($page, $perPage)->values(),
            $rows->count(),
            $perPage,
            $page,
            ['path' => $request->url(), 'query' => $request->query()],
        );

        return response()->json([
            'data' => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
                'total'        => $paginator->total(),
                'per_page'     => $perPage,
            ],
        ]);
    }

    /**
     * The reference console's "Active" button. There is no `active` field on a
     * teacher — what it means in practice is whether they appear in the public
     * tutor directory, which is tutors.is_published. Labelled "Listed" in the
     * UI so it says what it does.
     */
    public function toggleListing(Request $request, TeacherProfile $teacherProfile)
    {
        $data  = $request->validate(['is_listed' => 'required|boolean']);
        $tutor = $teacherProfile->user?->tutor;

        if (!$tutor) {
            return response()->json([
                'message' => 'This teacher has no directory listing yet — approve their application first.',
            ], 422);
        }

        $tutor->update(['is_published' => $data['is_listed']]);
        AuditLog::record('teacher_listing', 'teacher_profile', $teacherProfile->id, $teacherProfile->user?->name, [
            'listed' => $data['is_listed'],
        ]);

        return response()->json(['data' => ['id' => $teacherProfile->id, 'is_listed' => (bool) $data['is_listed']]]);
    }

    /** teacher_profiles stores a comma string, teacher_applications stores JSON. */
    private function toList($value): array
    {
        if (is_array($value)) return array_values(array_filter($value));

        return array_values(array_filter(array_map('trim', explode(',', (string) $value))));
    }
}
