<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Http\Resources\StudentResource;
use App\Models\Student;
use Illuminate\Http\Request;

class StudentController extends Controller {
    public function index(Request $request) {
        return StudentResource::collection($request->user()->students()->latest()->get());
    }

    public function store(Request $request) {
        $student = $request->user()->students()->create($this->rules($request));
        return (new StudentResource($student))->response()->setStatusCode(201);
    }

    public function update(Request $request, Student $student) {
        $this->authorizeOwner($request, $student);
        $student->update($this->rules($request));
        return new StudentResource($student);
    }

    public function destroy(Request $request, Student $student) {
        $this->authorizeOwner($request, $student);
        $student->delete();
        return response()->json(['message' => 'Student removed.']);
    }

    private function rules(Request $request): array {
        return $request->validate([
            'name'          => 'required|string|max:120',
            'grade'         => 'nullable|string|max:40',
            'board'         => 'nullable|string|max:20',
            'subjects'      => 'nullable|string|max:255',
            'date_of_birth' => 'nullable|date',
            'notes'         => 'nullable|string|max:1000',
        ]);
    }

    private function authorizeOwner(Request $request, Student $student): void {
        abort_unless($student->user_id === $request->user()->id, 403);
    }
}
