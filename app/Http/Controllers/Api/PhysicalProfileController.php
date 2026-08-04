<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PhysicalProfileResource;
use App\Models\AuditLog;
use App\Models\PhysicalTeachingProfile;
use App\Services\PhysicalProfileWriter;
use Illuminate\Http\Request;

/** The teacher's own physical / home-tuition profile. */
class PhysicalProfileController extends Controller
{
    public function show(Request $request)
    {
        return new PhysicalProfileResource($this->profileFor($request));
    }

    public function update(Request $request)
    {
        $profile = $this->profileFor($request);

        $payload = $request->all();
        if (isset($payload['offerings']) && is_array($payload['offerings'])) {
            $payload['offerings'] = PhysicalProfileWriter::normalizeGrades($payload['offerings']);
        }

        $data = validator($payload, PhysicalProfileWriter::rules())->validate();
        $publish = $request->boolean('publish');

        $before = $profile->status;
        $saved  = PhysicalProfileWriter::save($profile, $data, $publish ? 'active' : null);

        if ($publish && $before !== 'active') {
            AuditLog::record('physical_profile_published', 'physical_teaching_profile', $saved->id,
                $request->user()->name, ['from' => $before, 'to' => $saved->status]);
        }

        return new PhysicalProfileResource($saved);
    }

    /** Pause / resume matching without wiping the profile. */
    public function setStatus(Request $request)
    {
        $data = validator($request->all(), [
            'status' => ['required', 'in:active,paused'],
        ])->validate();

        $profile = $this->profileFor($request);
        // Nothing to pause if it was never published — and "active" on an empty
        // profile would hand the matcher a teacher with no address or subjects.
        abort_if($profile->status === 'draft' && $data['status'] === 'active', 422,
            'Complete and publish your profile before turning matching on.');

        $profile->update(['status' => $data['status']]);
        return new PhysicalProfileResource($profile->fresh(['offerings', 'slots', 'exceptions']));
    }

    private function profileFor(Request $request): PhysicalTeachingProfile
    {
        abort_unless($request->user()->isTeacher(), 403, 'Teacher accounts only.');

        $profile = $request->user()->physicalProfile()->with(['offerings', 'slots', 'exceptions'])->first();
        if ($profile) return $profile;

        // A teacher who applied through the public form already has a profile
        // attached to that application — claim it rather than starting them
        // from a blank page and losing what they typed.
        $claimed = PhysicalTeachingProfile::whereNull('user_id')
            ->whereHas('application', fn ($q) => $q->where('email', $request->user()->email))
            ->first();

        if ($claimed) {
            $claimed->update(['user_id' => $request->user()->id]);
            return $claimed->load(['offerings', 'slots', 'exceptions']);
        }

        // fresh(), not the created instance: several columns (nationality,
        // country, the venue booleans) come from database defaults, and the
        // in-memory model does not know them. Handing the client nulls for
        // those makes its first save look like a deliberate clear.
        return PhysicalTeachingProfile::create([
            'user_id' => $request->user()->id,
            'status'  => 'draft',
            'city'    => $request->user()->teacherProfile?->city,
        ])->fresh(['offerings', 'slots', 'exceptions']);
    }
}
