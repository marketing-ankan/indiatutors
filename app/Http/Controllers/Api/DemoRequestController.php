<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Http\Resources\DemoRequestResource;
use App\Models\DemoRequest;
use Illuminate\Http\Request;

class DemoRequestController extends Controller {
    public function store(Request $request) {
        $data = $request->validate([
            'name'               => 'required|string|max:120',
            'email'              => 'required|email|max:180',
            'phone'              => 'required|string|max:20',
            'phone_country_code' => 'nullable|string|max:6',
            'subject'            => 'nullable|string|max:120',
            'grade'              => 'nullable|string|max:40',
            'board'              => 'nullable|string|max:20',
            'mode'               => 'nullable|in:online,home',
            'city'               => 'nullable|string|max:80',
            'country'            => 'nullable|string|max:80',
            'timezone'           => 'nullable|string|max:60',
            'message'            => 'nullable|string|max:2000',
            'whatsapp_consent'   => 'nullable|boolean',
            'marketing_consent'  => 'nullable|boolean',
            'course_id'          => 'nullable|integer|exists:courses,id',
            'student_id'         => 'nullable|integer|exists:students,id',
            // Which of the five booking flows this came from, so the console can
            // filter by it instead of pattern-matching the message text.
            'type'               => 'nullable|in:' . implode(',', DemoRequest::TYPES),
        ]);

        // If the request carries a valid bearer token, link it to that account.
        $user = auth('sanctum')->user();
        if ($user) {
            $data['user_id'] = $user->id;
            // Only attach a student the user actually owns.
            if (!empty($data['student_id']) && !$user->students()->whereKey($data['student_id'])->exists()) {
                unset($data['student_id']);
            }
        } else {
            unset($data['student_id']); // guests can't attach a student profile
        }

        $demo = DemoRequest::create($data + ['status' => 'new']);
        return response()->json(['message' => 'Demo request received. Our team will contact you within 24 hours.', 'id' => $demo->id], 201);
    }

    /** A signed-in parent's own demo requests (with status). */
    public function myIndex(Request $request) {
        return DemoRequestResource::collection(
            $request->user()->demoRequests()
                ->with(['course:id,name,slug', 'student:id,name'])
                ->latest()->get()
        );
    }
}
