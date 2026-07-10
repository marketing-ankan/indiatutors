<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Http\Resources\TeacherProfileResource;
use Illuminate\Http\Request;

class TeacherController extends Controller {
    public function showMine(Request $request) {
        abort_unless($request->user()->isTeacher(), 403, 'Teacher accounts only.');
        $profile = $request->user()->teacherProfile()->firstOrCreate([], ['status' => 'pending']);
        return new TeacherProfileResource($profile);
    }

    public function updateMine(Request $request) {
        abort_unless($request->user()->isTeacher(), 403, 'Teacher accounts only.');
        $data = $request->validate([
            'headline'          => 'nullable|string|max:255',
            'qualification'     => 'nullable|string|max:255',
            'subjects'          => 'nullable|string|max:255',
            'languages'         => 'nullable|string|max:255',
            'experience_years'  => 'nullable|integer|min:0|max:70',
            'fee_hourly'        => 'nullable|numeric|min:0|max:100000',
            'city'              => 'nullable|string|max:80',
            'teaching_mode'     => 'nullable|in:online,home,both',
            'service_areas'     => 'nullable|string|max:255',
            'availability'      => 'nullable|array',
            'availability.days' => 'nullable|array',
            'availability.slots'=> 'nullable|string|max:255',
            'bio'               => 'nullable|string|max:2000',
        ]);
        $profile = $request->user()->teacherProfile()->firstOrCreate([], ['status' => 'pending']);
        $profile->update($data);
        return new TeacherProfileResource($profile->fresh());
    }
}
