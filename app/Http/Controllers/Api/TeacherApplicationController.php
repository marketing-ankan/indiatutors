<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\TeacherApplication;
use Illuminate\Http\Request;
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

        return response()->json([
            'message' => "Thanks — your application has been received. Our team reviews every application and will get back to you.",
            'id'      => $app->id,
        ], 201);
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

        return response()->json($teacherApplication);
    }

    // Admin: download an applicant's CV (stored privately).
    public function downloadCv(TeacherApplication $teacherApplication)
    {
        abort_if(!$teacherApplication->cv_path || !Storage::exists($teacherApplication->cv_path), 404);
        return Storage::download($teacherApplication->cv_path, $teacherApplication->cv_name ?: 'cv');
    }
}
