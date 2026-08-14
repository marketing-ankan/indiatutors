<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppNotification;
use App\Models\AuditLog;
use App\Models\TeacherApplication;
use App\Models\TeacherProfile;
use App\Support\TeacherAccountProvisioner;
use App\Support\TeacherProfilePublisher;
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
            // The tutor relation is loaded WHOLE, not column-restricted. The
            // pending-changes diff compares every published field against the
            // profile, and a restricted select returns null for the columns it
            // omits — which made every field look changed on every teacher.
            ->with(['user:id,name,email', 'user.tutor'])
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
                // The green "✓ Verified" badge on the public card. Returned so
                // the console can show and withdraw it — see toggleVerified.
                'verified'   => (bool) $p->user?->tutor?->verified,
                'tutor_slug' => $p->user?->tutor?->slug,
                'has_cv'     => false,
                'video_url'  => null,
                // A4: edits waiting on a human, with the actual before/after so
                // staff approve a change rather than a notification.
                'pending_changes'  => $p->changes_submitted_at
                    ? TeacherProfilePublisher::diff($p, $p->user?->tutor)
                    : [],
                'changes_since'    => optional($p->changes_submitted_at)->toDateTimeString(),
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
                'verified'   => false,       // an applicant has no listing yet
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
    /**
     * Give the teachers who are listed but have no login a way in.
     *
     * The passwords come back in the response, which is deliberate and is the
     * whole reason this exists alongside the artisan command: the command writes
     * them to a file on the server, and an owner who cannot reach a shell cannot
     * fetch that file. There is no mail configured to send them either. So they
     * are returned once, over HTTPS, to an already-authenticated admin, shown
     * once, and never stored anywhere this app can read back — the audit entry
     * records the address and never the password.
     */
    public function provisionAccounts(Request $request)
    {
        $data = $request->validate([
            'domain'  => 'nullable|string|max:120',
            'dry_run' => 'nullable|boolean',
        ]);

        $dry    = (bool) ($data['dry_run'] ?? false);
        $domain = trim($data['domain'] ?? 'indiatutorsonline.com');

        $result = TeacherAccountProvisioner::run($domain, $dry);

        return response()->json([
            'dry_run'   => $dry,
            'created'   => $result['created'],
            'skipped'   => $result['skipped'],
            'remaining' => TeacherAccountProvisioner::pendingCount(),
        ]);
    }

    /** How many listings still have no login — drives the button's label. */
    public function provisionStatus()
    {
        return response()->json(['pending' => TeacherAccountProvisioner::pendingCount()]);
    }

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

    /**
     * Grant or withdraw the green "✓ Verified" badge on a public tutor card.
     *
     * `tutors.verified` is `default(true)` in the schema and the live creation
     * path never assigns it, so every teacher who has ever appeared in the
     * directory has carried this badge by default — and nothing in the platform
     * could take it away. It is a trust claim shown to parents choosing a tutor
     * for their child, so staff need to be able to withdraw it.
     */
    public function toggleVerified(Request $request, TeacherProfile $teacherProfile)
    {
        $data  = $request->validate(['verified' => 'required|boolean']);
        $tutor = $teacherProfile->user?->tutor;

        if (!$tutor) {
            return response()->json([
                'message' => 'This teacher has no directory listing yet — approve their application first.',
            ], 422);
        }

        $tutor->update(['verified' => $data['verified']]);
        AuditLog::record('teacher_verified', 'teacher_profile', $teacherProfile->id, $teacherProfile->user?->name, [
            'verified' => $data['verified'],
        ]);

        return response()->json(['data' => ['id' => $teacherProfile->id, 'verified' => (bool) $data['verified']]]);
    }

    /**
     * Publish a teacher's pending edits to their public listing (A4).
     *
     * The gate exists because the alternative is a teacher's free text going
     * live on a public page with nobody in between. Staff see the diff first —
     * `pendingChanges` below hands them field-by-field before/after, so this is
     * a decision rather than a rubber stamp.
     */
    public function publishChanges(TeacherProfile $teacherProfile)
    {
        $tutor = $teacherProfile->user?->tutor;
        if (! $tutor) {
            return response()->json([
                'message' => 'This teacher has no directory listing yet — approve their application first.',
            ], 422);
        }

        $diff = TeacherProfilePublisher::diff($teacherProfile, $tutor);
        if (! $diff) {
            // Clear a flag left by an edit that was later reverted, so the queue
            // does not keep an item nobody can action.
            $teacherProfile->forceFill(['changes_submitted_at' => null])->save();
            return response()->json(['message' => 'Nothing to publish — the listing already matches this profile.']);
        }

        TeacherProfilePublisher::publish($teacherProfile);

        AuditLog::record('teacher_profile_published', 'teacher_profile', $teacherProfile->id,
            $teacherProfile->user?->name, ['fields' => array_keys($diff)]);

        AppNotification::send(
            $teacherProfile->user_id,
            'teacher_profile_published',
            'Your profile changes are live',
            'The edits you made to your teaching profile have been reviewed and published.',
        );

        return response()->json([
            'message' => 'Published ' . count($diff) . ' change' . (count($diff) === 1 ? '' : 's') . ' to the public profile.',
            'data'    => ['id' => $teacherProfile->id, 'published' => array_keys($diff)],
        ]);
    }

    /**
     * Discard pending edits — the listing stays as it is.
     *
     * Note this does NOT revert teacher_profiles: the teacher's own copy keeps
     * what they wrote, because silently rewriting someone's draft is worse than
     * declining to publish it. Staff should say why out of band.
     */
    public function discardChanges(TeacherProfile $teacherProfile)
    {
        $teacherProfile->forceFill(['changes_submitted_at' => null])->save();
        AuditLog::record('teacher_profile_changes_discarded', 'teacher_profile', $teacherProfile->id,
            $teacherProfile->user?->name);

        return response()->json(['message' => 'Changes left unpublished. The public profile is unchanged.']);
    }

    /** teacher_profiles stores a comma string, teacher_applications stores JSON. */
    private function toList($value): array
    {
        if (is_array($value)) return array_values(array_filter($value));

        return array_values(array_filter(array_map('trim', explode(',', (string) $value))));
    }
}
