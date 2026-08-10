<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PhysicalProfileResource;
use App\Http\Resources\TuitionRequirementResource;
use App\Models\AuditLog;
use App\Models\PhysicalTeachingProfile;
use App\Models\TuitionRequirement;
use App\Support\GradeScale;
use App\Support\PincodeDirectory;
use App\Support\TeacherMatcher;
use Illuminate\Http\Request;

/**
 * Staff console: the two physical / home-tuition queues.
 *
 * Read, triage, and SUGGEST — since 2026-08-07 the console ranks plausible
 * teachers for a requirement (suggestions(), read-only, same TeacherMatcher
 * rules as the export). It still does not assign: which teacher goes to which
 * student is recorded by the leads-management software through the export
 * write-back, and updateRequirement() explains why that stays single-source.
 */
class AdminPhysicalController extends Controller
{
    public function profiles(Request $request)
    {
        $q = PhysicalTeachingProfile::query()
            ->with(['user:id,name,email,phone', 'application:id,name,email,phone'])
            ->withCount(['offerings', 'slots'])
            ->when($request->filled('status'), fn ($b) => $b->where('status', $request->string('status')))
            ->when($request->filled('q'), function ($b) use ($request) {
                $term = '%' . $request->string('q') . '%';
                $b->where(fn ($w) => $w
                    ->where('city', 'like', $term)->orWhere('pincode', 'like', $term)
                    ->orWhere('district', 'like', $term)
                    ->orWhereHas('user', fn ($u) => $u->where('name', 'like', $term)->orWhere('email', 'like', $term))
                    ->orWhereHas('application', fn ($u) => $u->where('name', 'like', $term)->orWhere('email', 'like', $term)));
            })
            ->latest('updated_at');

        $page = $q->paginate(20);
        $page->getCollection()->transform(fn ($p) => [
            'id'            => $p->id,
            'name'          => $p->user?->name ?? $p->application?->name ?? '—',
            'email'         => $p->user?->email ?? $p->application?->email,
            'phone'         => $p->user?->phone ?? $p->application?->phone,
            'has_account'   => (bool) $p->user_id,
            'status'        => $p->status,
            'completeness'  => $p->completeness(),
            'city'          => $p->city,
            'district'      => $p->district,
            'state'         => $p->state,
            'pincode'       => $p->pincode,
            'radius_km'     => $p->service_radius_km,
            'geo_source'    => $p->geo_source,
            'has_coords'    => $p->latitude !== null,
            'offerings_count' => $p->offerings_count,
            'slots_count'   => $p->slots_count,
            'police_verified' => $p->police_verified,
            'updated_at'    => $p->updated_at?->toIso8601String(),
        ]);

        return $this->paginated($page, $page->items());
    }

    public function profile(PhysicalTeachingProfile $profile)
    {
        return new PhysicalProfileResource($profile->load(['offerings', 'slots', 'exceptions']));
    }

    /**
     * Staff can pause or resume a profile — which is what decides whether it is
     * exported to the leads software at all — and record an offline police check.
     */
    public function updateProfile(Request $request, PhysicalTeachingProfile $profile)
    {
        $data = validator($request->all(), [
            'status'             => ['nullable', 'in:draft,submitted,active,paused'],
            'police_verified'    => ['nullable', 'boolean'],
            'police_verified_on' => ['nullable', 'date'],
        ])->validate();

        $before = $profile->status;
        $profile->update($data);

        AuditLog::record('physical_profile_update', 'physical_teaching_profile', $profile->id,
            $profile->user?->name ?? $profile->application?->name,
            array_filter(['from' => $before, 'to' => $data['status'] ?? null]));

        return new PhysicalProfileResource($profile->fresh(['offerings', 'slots', 'exceptions']));
    }

    public function requirements(Request $request)
    {
        $q = TuitionRequirement::query()
            ->with(['student:id,code,name', 'user:id,name,email', 'matchedProfile:id,user_id'])
            ->when($request->filled('status'), fn ($b) => $b->where('status', $request->string('status')))
            ->when($request->filled('q'), function ($b) use ($request) {
                $term = '%' . $request->string('q') . '%';
                $b->where(fn ($w) => $w
                    ->where('code', 'like', $term)->orWhere('contact_name', 'like', $term)
                    ->orWhere('contact_phone', 'like', $term)->orWhere('learner_name', 'like', $term)
                    ->orWhere('city', 'like', $term)->orWhere('pincode', 'like', $term));
            })
            ->latest('id');

        $page = $q->paginate(20);
        $page->getCollection()->transform(fn ($r) => [
            'id'          => $r->id,
            'code'        => $r->code,
            'status'      => $r->status,
            'learner'     => $r->learner_name ?? $r->student?->name ?? '—',
            'grade_label' => GradeScale::label($r->grade),
            'board'       => $r->board,
            'subjects'    => $r->subjects ?? [],
            'city'        => $r->city,
            'pincode'     => $r->pincode,
            'venue'       => $r->venue_preference,
            'urgency'     => $r->urgency,
            'budget'      => $r->budget_max_hourly,
            'contact_name'=> $r->contact_name ?? $r->user?->name,
            'contact_phone'=> $r->contact_phone,
            'has_coords'  => $r->latitude !== null,
            'matched_profile_id' => $r->matched_profile_id,
            'created_at'  => $r->created_at?->toIso8601String(),
        ]);

        return $this->paginated($page, $page->items());
    }

    public function requirement(TuitionRequirement $requirement)
    {
        return new TuitionRequirementResource($requirement);
    }

    /**
     * Read-only ranked shortlist: who could plausibly serve this requirement,
     * by real distance and subject overlap. Suggests, never assigns.
     *
     * Anchored on the requirement's own geocoded point when it has one — that
     * is the actual doorstep, better than any centroid — falling back to the
     * pincode centroid via PincodeDirectory. Reach and ordering rules are
     * TeacherMatcher's, shared verbatim with /api/matching/v1/teachers?near=,
     * so staff and the leads software always see the same shortlist logic.
     */
    public function suggestions(Request $request, TuitionRequirement $requirement)
    {
        $pin = preg_replace('/\D/', '', (string) $requirement->pincode);

        if ($requirement->latitude !== null && $requirement->longitude !== null) {
            $anchor = 'address';
            $centre = [
                'latitude'  => (float) $requirement->latitude,
                'longitude' => (float) $requirement->longitude,
                'district'  => $requirement->district,
                'state'     => $requirement->state,
            ];
        } else {
            $centre = strlen($pin) === 6 ? (PincodeDirectory::lookup($pin) ?? []) : [];
            $anchor = isset($centre['latitude']) ? 'pincode' : 'pincode-only';
        }

        // The family already told us how far a teacher may live; honour it as
        // the default "nearby" horizon instead of inventing one.
        $withinKm = (float) ($request->input('within_km')
            ?: $requirement->max_teacher_distance_km ?: 25);
        $withinKm = min(max($withinKm, 1), 100);

        $subjects = collect((array) ($requirement->subjects ?? []))
            ->map(fn ($s) => trim((string) $s))->filter()->values();
        if ($request->filled('subject')) {
            $subjects = collect([trim((string) $request->string('subject'))]);
        }

        $rows = PhysicalTeachingProfile::query()
            ->with(['offerings', 'user:id,name,email,phone'])
            ->where('status', 'active')
            ->when($subjects->isNotEmpty(), fn ($b) => $b->whereHas('offerings',
                function ($o) use ($subjects) {
                    $o->where(function ($w) use ($subjects) {
                        foreach ($subjects as $s) {
                            $w->orWhere('subject', 'like', "%{$s}%");
                        }
                    });
                }))
            ->get()
            ->map(function (PhysicalTeachingProfile $p) use ($pin, $centre, $withinKm, $subjects) {
                $q = TeacherMatcher::qualify($p, $pin, $centre, $withinKm);
                if (! $q) {
                    return null;
                }
                $matched = $subjects->isEmpty() ? collect() : $p->offerings
                    ->pluck('subject')
                    ->filter(fn ($sub) => $subjects->contains(
                        fn ($s) => stripos((string) $sub, $s) !== false))
                    ->unique()->values();

                return ['profile' => $p, 'matched_subjects' => $matched] + $q;
            })
            ->filter();

        $rows = TeacherMatcher::rank($rows)
            ->take(min(max((int) $request->integer('limit', 10), 1), 25))
            ->values();

        return response()->json([
            'data' => $rows->map(fn ($r) => [
                'profile_id'       => $r['profile']->id,
                'name'             => $r['profile']->user?->name,
                'phone'            => $r['profile']->user?->phone,
                'email'            => $r['profile']->user?->email,
                'locality'         => $r['profile']->locality,
                'city'             => $r['profile']->city,
                'pincode'          => $r['profile']->pincode,
                'radius_km'        => (float) $r['profile']->service_radius_km,
                'experience_years' => $r['profile']->experience_years,
                'police_verified'  => (bool) $r['profile']->police_verified,
                'distance_km'      => $r['km'] !== null ? round($r['km'], 1) : null,
                'match'            => $r['reasons'],
                'matched_subjects' => $r['matched_subjects'],
                'offerings'        => $r['profile']->offerings->map(fn ($o) => [
                    'subject'     => $o->subject,
                    'fee_hourly'  => $o->fee_hourly,
                    'fee_monthly' => $o->fee_monthly,
                ])->values(),
            ])->all(),
            'meta' => [
                'anchor'    => $anchor,
                'within_km' => $withinKm,
                'subjects'  => $subjects,
                'count'     => $rows->count(),
                'note'      => 'Ranked hints only — the assignment itself is recorded by the leads-management software.',
            ],
        ]);
    }

    /**
     * Staff bookkeeping on a request: put it on hold, close it, add a note.
     *
     * Deliberately cannot assign a teacher. Which teacher goes to which student
     * is the leads-management software's decision — it records the result here
     * through the export write-back (PATCH /api/matching/v1/requirements/{id}).
     * A second place that could set `matched_profile_id` would be a second
     * source of truth for the one fact this system does not own.
     */
    public function updateRequirement(Request $request, TuitionRequirement $requirement)
    {
        $data = validator($request->all(), [
            'status' => ['nullable', 'in:open,matched,on_hold,closed'],
            'notes'  => ['nullable', 'string', 'max:2000'],
        ])->validate();

        $requirement->update($data);

        AuditLog::record('requirement_update', 'tuition_requirement', $requirement->id, $requirement->code, $data);

        return new TuitionRequirementResource($requirement->fresh());
    }
}
