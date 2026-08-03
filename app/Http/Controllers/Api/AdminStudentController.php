<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AdminStudentResource;
use App\Models\AuditLog;
use App\Models\Student;
use Illuminate\Http\Request;

// Every student profile on the platform, across all guardians. The parent-facing
// StudentController is deliberately scoped to the caller's own children; this is
// the staff view of the same table.
class AdminStudentController extends Controller
{
    public function index(Request $request)
    {
        $q = Student::query()
            ->with(['user:id,name,email', 'account:id,name,email'])
            ->withCount('enrollments')
            ->latest();

        if ($s = trim($request->string('q')->toString())) {
            $q->where(fn ($w) => $w
                ->where('name', 'like', "%{$s}%")
                ->orWhere('code', 'like', "%{$s}%")
                ->orWhere('subjects', 'like', "%{$s}%")
                ->orWhereHas('user', fn ($u) => $u->where('name', 'like', "%{$s}%")->orWhere('email', 'like', "%{$s}%")));
        }

        return AdminStudentResource::collection($q->paginate(20));
    }

    public function update(Request $request, Student $student)
    {
        $data = $request->validate([
            'name'     => 'required|string|max:120',
            'grade'    => 'nullable|string|max:40',
            'board'    => 'nullable|string|max:20',
            'subjects' => 'nullable|string|max:255',
            'notes'    => 'nullable|string|max:1000',
        ]);

        $student->update($data);
        AuditLog::record('student_updated', 'student', $student->id, $student->code . ' · ' . $student->name);

        return new AdminStudentResource($student->fresh()->load('user:id,name,email')->loadCount('enrollments'));
    }
}
