<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Http\Resources\EnrollmentResource;
use Illuminate\Http\Request;

class EnrollmentController extends Controller {
    /** A signed-in parent's enrollments (across all their students). */
    public function myIndex(Request $request) {
        return EnrollmentResource::collection(
            $request->user()->enrollments()
                ->with(['student:id,name', 'tutor:id,name,slug', 'course:id,name,slug'])
                ->latest()->get()
        );
    }
}
