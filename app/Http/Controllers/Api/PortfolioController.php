<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\AppNotification;
use App\Models\PortfolioItem;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PortfolioController extends Controller {
    public function index(Request $request, Student $student) {
        $this->authorizeStudent($request, $student);
        return response()->json(['data' => $student->portfolioItems()->with('author:id,name,role')->get()->map(fn ($i) => $this->present($i))]);
    }

    public function store(Request $request, Student $student) {
        $this->authorizeStudent($request, $student);
        $data = $request->validate([
            'type'        => 'required|in:achievement,certificate,milestone,artwork,other',
            'title'       => 'required|string|max:160',
            'description' => 'nullable|string|max:2000',
            'awarded_on'  => 'nullable|date',
            'link_url'    => 'nullable|url|max:500',
            'file'        => 'nullable|file|max:5120|mimes:jpg,jpeg,png,pdf',
        ]);

        $path = $request->hasFile('file')
            ? $request->file('file')->store("portfolio/{$student->id}", 'local')
            : null;

        $item = $student->portfolioItems()->create([
            'added_by'      => $request->user()->id,
            'type'          => $data['type'],
            'title'         => $data['title'],
            'description'   => $data['description'] ?? null,
            'awarded_on'    => $data['awarded_on'] ?? null,
            'link_url'      => $data['link_url'] ?? null,
            'original_name' => $request->hasFile('file') ? $request->file('file')->getClientOriginalName() : null,
            'path'          => $path,
        ]);

        // A teacher adding to the portfolio notifies the parent.
        if ($request->user()->isTeacher() && $student->user_id !== $request->user()->id) {
            AppNotification::send(
                $student->user_id,
                'portfolio_added',
                "New portfolio entry for {$student->name}",
                "\"{$item->title}\" was added by their teacher.",
            );
        }

        return response()->json(['data' => $this->present($item->load('author:id,name,role'))], 201);
    }

    public function destroy(Request $request, PortfolioItem $item) {
        $user = $request->user();
        abort_unless(
            $item->student->user_id === $user->id || $item->added_by === $user->id || $user->isAdmin(),
            403, 'Not your portfolio item.'
        );
        if ($item->path) Storage::disk('local')->delete($item->path);
        $item->delete();
        return response()->json(['message' => 'Removed.']);
    }

    public function download(Request $request, PortfolioItem $item) {
        $this->authorizeStudent($request, $item->student);
        abort_unless($item->path && Storage::disk('local')->exists($item->path), 404, 'No file attached.');
        return Storage::disk('local')->download($item->path, $item->original_name ?? 'portfolio-item');
    }

    private function present(PortfolioItem $i): array {
        return [
            'id'          => $i->id,
            'type'        => $i->type,
            'title'       => $i->title,
            'description' => $i->description,
            'awarded_on'  => optional($i->awarded_on)->toDateString(),
            'link_url'    => $i->link_url,
            'has_file'    => $i->path !== null,
            'added_by'    => $i->author?->only(['name', 'role']),
            'created_at'  => optional($i->created_at)->toDateString(),
        ];
    }

    /** Owner parent, the student themselves, an assigned teacher, or admin. */
    private function authorizeStudent(Request $request, Student $student): void {
        $user = $request->user();
        $isParent  = $student->user_id === $user->id;
        // The student's own linked account. Explicit null check so an unlinked
        // profile never matches.
        $isSelf    = $student->account_user_id !== null && $student->account_user_id === $user->id;
        $isTeacher = $user->isTeacher() && $user->tutor
            && $student->enrollments()->where('tutor_id', $user->tutor->id)->exists();
        abort_unless($isParent || $isSelf || $isTeacher || $user->isAdmin(), 403, 'Not your student.');
    }
}
