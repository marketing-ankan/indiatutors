<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PhysicalProfileResource;
use App\Http\Resources\TuitionRequirementResource;
use App\Models\AuditLog;
use App\Models\PhysicalTeachingProfile;
use App\Models\TuitionRequirement;
use App\Support\GradeScale;
use Illuminate\Http\Request;

/**
 * Staff console: the two physical / home-tuition queues.
 *
 * Read-and-triage only. This console shows what was captured and lets staff
 * verify, pause or close a record — it does not rank teachers or propose
 * candidates. Matching and suggesting happen in the leads-management software,
 * which reads /api/matching/v1/* and writes the chosen teacher back.
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

        return $page;
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

        return $page;
    }

    public function requirement(TuitionRequirement $requirement)
    {
        return new TuitionRequirementResource($requirement);
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
