<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\ExamUpdate;
use Illuminate\Http\Request;

class ExamUpdateController extends Controller {
    /** Published feed for signed-in dashboards (parents/teachers). */
    public function index() {
        return response()->json(['data' => ExamUpdate::published()
            ->orderByRaw('CASE WHEN exam_date IS NULL THEN 1 ELSE 0 END')
            ->orderBy('exam_date')->latest('id')->limit(10)->get()
            ->map(fn ($u) => $this->present($u))]);
    }

    // --- Admin CRUD (routes sit behind the admin middleware) ---

    public function adminIndex() {
        return response()->json(['data' => ExamUpdate::latest()->limit(50)->get()->map(fn ($u) => $this->present($u))]);
    }

    public function store(Request $request) {
        $data = $this->validated($request);
        $u = ExamUpdate::create($data + ['created_by' => $request->user()->id]);
        return response()->json(['data' => $this->present($u)], 201);
    }

    public function update(Request $request, ExamUpdate $examUpdate) {
        $examUpdate->update($this->validated($request, true));
        return response()->json(['data' => $this->present($examUpdate->fresh())]);
    }

    public function destroy(ExamUpdate $examUpdate) {
        $examUpdate->delete();
        return response()->json(['message' => 'Removed.']);
    }

    private function validated(Request $request, bool $partial = false): array {
        return $request->validate([
            'title'        => ($partial ? 'sometimes' : 'required').'|string|max:200',
            'body'         => 'nullable|string|max:3000',
            'exam_date'    => 'nullable|date',
            'link_url'     => 'nullable|url|max:500',
            'is_published' => 'sometimes|boolean',
        ]);
    }

    private function present(ExamUpdate $u): array {
        return [
            'id'           => $u->id,
            'title'        => $u->title,
            'body'         => $u->body,
            'exam_date'    => optional($u->exam_date)->toDateString(),
            'link_url'     => $u->link_url,
            'is_published' => $u->is_published,
            'created_at'   => optional($u->created_at)->toDateString(),
        ];
    }
}
