<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\PhysicalTeachingProfile;
use App\Models\TeacherApplication;
use App\Services\PhysicalProfileWriter;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class TeacherApplicationController extends Controller
{
    // Public: submit a "Become a Teacher" application (WinQuest-style form).
    public function store(Request $request)
    {
        $data = $request->validate([
            'name'              => ['required', 'string', 'max:190'],
            'email'             => ['required', 'email', 'max:190'],
            'phone'             => ['required', 'string', 'max:40'],
            'subjects'          => ['nullable', 'array'],
            'subjects.*'        => ['string', 'max:190'],
            'cv'                => ['nullable', 'file', 'mimes:pdf,doc,docx', 'max:5120'], // 5 MB
            'video_url'         => ['nullable', 'url', 'max:500'],
            'address'           => ['nullable', 'string', 'max:1000'],
            'city'              => ['nullable', 'string', 'max:120'],
            'pincode'           => ['nullable', 'string', 'max:12'],
            'service_radius_km' => ['nullable', 'integer', 'min:0', 'max:500'],
            'teaches_online'    => ['nullable', 'boolean'],
            'availability'      => ['nullable', 'array'],
            'notes'             => ['nullable', 'string', 'max:2000'],
            'terms'             => ['accepted'],
        ]);

        // Store the CV privately (not web-accessible); admins download via an authed route.
        $cvPath = $cvName = null;
        if ($request->hasFile('cv')) {
            $cvName = $request->file('cv')->getClientOriginalName();
            $cvPath = $request->file('cv')->store('teacher-cvs');   // storage/app/teacher-cvs
        }

        $app = TeacherApplication::create([
            'name'              => $data['name'],
            'email'             => $data['email'],
            'phone'             => $data['phone'],
            'subjects'          => $data['subjects'] ?? [],
            'cv_path'           => $cvPath,
            'cv_name'           => $cvName,
            'video_url'         => $data['video_url'] ?? null,
            'address'           => $data['address'] ?? null,
            'city'              => $data['city'] ?? null,
            'pincode'           => $data['pincode'] ?? null,
            'service_radius_km' => $data['service_radius_km'] ?? null,
            'teaches_online'    => $request->boolean('teaches_online', true),
            'availability'      => $data['availability'] ?? null,
            'notes'             => $data['notes'] ?? null,
            'status'            => 'pending',
        ]);

        $this->storePhysicalProfile($request, $app);

        return response()->json([
            'message' => "Thanks — your application has been received. Our team reviews every application and will get back to you.",
            'id'      => $app->id,
        ], 201);
    }

    /**
     * The physical-tuition half of the apply form (address, travel radius,
     * subject-by-grade offerings, weekly availability) lands in the same tables
     * the teacher dashboard edits — not in a copy on the application row.
     *
     * It arrives as one JSON blob under `physical` because the form is
     * multipart (it carries a CV), and nested arrays through multipart are a
     * reliable source of "why is boards[] a string".
     *
     * A failure here must not lose the application: someone who filled in a
     * long form and uploaded a CV should not see an error because their
     * availability grid was malformed. The lead is saved either way and the
     * profile is completed later from the dashboard.
     */
    private function storePhysicalProfile(Request $request, TeacherApplication $app): void
    {
        $physical = $request->input('physical');
        if (is_string($physical)) $physical = json_decode($physical, true);
        if (!is_array($physical) || !$physical) return;

        try {
            $physical['offerings'] = PhysicalProfileWriter::normalizeGrades($physical['offerings'] ?? []);
            $data = validator($physical, PhysicalProfileWriter::rules())->validate();

            PhysicalProfileWriter::save(
                new PhysicalTeachingProfile(['teacher_application_id' => $app->id]),
                $data,
                'submitted',
            );
        } catch (\Throwable $e) {
            Log::warning('Teacher application physical profile rejected', [
                'application_id' => $app->id, 'error' => $e->getMessage(),
            ]);
        }
    }

    // Admin: list applications (newest first), filterable by status.
    public function adminIndex(Request $request)
    {
        $q = TeacherApplication::query()->latest();
        if ($request->filled('status')) $q->where('status', $request->string('status'));
        return $q->paginate(20);
    }

    // Admin: update an application's review status.
    public function updateStatus(Request $request, TeacherApplication $teacherApplication)
    {
        $data = $request->validate([
            'status' => ['required', 'in:pending,reviewing,approved,rejected'],
        ]);
        $before = $teacherApplication->status;
        $teacherApplication->update($data);
        AuditLog::record('teacher_status', 'teacher_application', $teacherApplication->id, $teacherApplication->name, [
            'from' => $before, 'to' => $data['status'],
        ]);

        if ($data['status'] === 'approved') $this->activatePhysicalProfile($teacherApplication);

        return response()->json($teacherApplication);
    }

    /**
     * Approving an application turns its physical profile live and, if the
     * applicant has since registered with the same email, hands the row to
     * their account — so they edit the profile they already filled in rather
     * than a second, empty one.
     *
     * Only profiles that are actually matchable go active: a submitted profile
     * with no address, no subjects or no availability would be handed to the
     * matcher and fail every filter, which looks like a matching bug rather
     * than an incomplete form.
     */
    private function activatePhysicalProfile(TeacherApplication $app): void
    {
        $profile = $app->physicalProfile;
        if (!$profile) return;

        if (!$profile->user_id) {
            $user = User::where('email', $app->email)->first();
            if ($user) $profile->user_id = $user->id;
        }

        if ($profile->status !== 'active' && $profile->completeness() >= 60) {
            $profile->status = 'active';
        }

        $profile->save();
    }

    // Admin: download an applicant's CV (stored privately).
    public function downloadCv(TeacherApplication $teacherApplication)
    {
        abort_if(!$teacherApplication->cv_path || !Storage::exists($teacherApplication->cv_path), 404);
        return Storage::download($teacherApplication->cv_path, $teacherApplication->cv_name ?: 'cv');
    }
}
