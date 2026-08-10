<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Course;
use App\Models\CourseMaterial;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * E3 + E4 — the company's teaching material, to whoever is entitled to it.
 *
 * One endpoint serves both audiences because it is one artefact: a teacher and
 * their enrolled students see the identical list for a course. Writing two
 * endpoints would let the two drift, which is the exact failure this table was
 * shaped to prevent.
 */
class CourseMaterialController extends Controller
{
    /** Material for every course this account is entitled to, grouped by course. */
    public function mine(Request $request)
    {
        $courseIds = CourseMaterial::courseIdsFor($request->user());

        $rows = CourseMaterial::query()
            ->published()
            ->with('course:id,name,slug')
            ->when($courseIds !== null, fn ($q) => $q->whereIn('course_id', $courseIds))
            ->orderBy('course_id')->orderBy('position')->orderBy('id')
            ->get();

        return response()->json([
            'data' => $rows->groupBy('course_id')->map(fn ($items) => [
                'course'    => $items->first()->course?->only(['id', 'name', 'slug']),
                'materials' => $items->map(fn ($m) => self::row($m))->values()->all(),
            ])->values()->all(),
        ]);
    }

    /**
     * Download. Entitlement is re-checked here rather than trusted from the
     * listing — the id is guessable, and a link that outlives an enrolment is
     * exactly what storing files privately is meant to prevent.
     */
    public function download(Request $request, CourseMaterial $material)
    {
        $courseIds = CourseMaterial::courseIdsFor($request->user());
        abort_unless($courseIds === null || in_array($material->course_id, $courseIds, true),
            403, 'This material is for a course you are not enrolled in.');
        // Unpublished material is staff-only even for an enrolled learner.
        abort_unless($material->is_published || $request->user()->isAdmin(), 404, 'Not available.');
        abort_unless($material->path && Storage::disk('local')->exists($material->path), 404, 'No file attached.');

        return Storage::disk('local')->download($material->path, $material->original_name ?? $material->title);
    }

    // ---- Staff ---------------------------------------------------------------

    public function adminIndex(Request $request)
    {
        $q = CourseMaterial::with(['course:id,name,slug', 'uploader:id,name'])
            ->orderBy('course_id')->orderBy('position')->orderBy('id');
        if ($courseId = $request->integer('course_id')) {
            $q->where('course_id', $courseId);
        }
        return response()->json(['data' => $q->limit(200)->get()->map(fn ($m) => self::row($m, true))->all()]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'course_id'   => 'required|integer|exists:courses,id',
            'type'        => 'required|in:' . implode(',', CourseMaterial::TYPES),
            'title'       => 'required|string|max:160',
            'description' => 'nullable|string|max:300',
            // Same ceiling and allow-list as teacher uploads, so one policy
            // governs every file this platform accepts.
            'file'        => 'nullable|file|max:10240|mimes:pdf,ppt,pptx,doc,docx,xls,xlsx,txt,jpg,jpeg,png',
            'link_url'    => 'nullable|url|max:500',
            'is_published'=> 'nullable|boolean',
            'position'    => 'nullable|integer|min:0|max:9999',
        ]);
        abort_if(! $request->hasFile('file') && empty($data['link_url']), 422, 'Attach a file or provide a link.');

        $file = $request->file('file');
        $material = CourseMaterial::create([
            'course_id'     => $data['course_id'],
            'uploaded_by'   => $request->user()->id,
            'type'          => $data['type'],
            'title'         => $data['title'],
            'description'   => $data['description'] ?? null,
            // Private disk, like class materials and KYC — never public/.
            'path'          => $file ? $file->store("course-materials/{$data['course_id']}", 'local') : null,
            'original_name' => $file?->getClientOriginalName(),
            'size_bytes'    => $file?->getSize(),
            'link_url'      => $data['link_url'] ?? null,
            'is_published'  => $data['is_published'] ?? true,
            'position'      => $data['position'] ?? 0,
        ]);

        AuditLog::record('course_material_added', 'course', $material->course_id,
            Course::find($material->course_id)?->name, ['title' => $material->title]);

        return response()->json(['message' => 'Material added.', 'data' => self::row($material->fresh('course'), true)], 201);
    }

    public function update(Request $request, CourseMaterial $material)
    {
        $data = $request->validate([
            'title'        => 'nullable|string|max:160',
            'description'  => 'nullable|string|max:300',
            'is_published' => 'nullable|boolean',
            'position'     => 'nullable|integer|min:0|max:9999',
        ]);
        $material->update(array_filter($data, fn ($v) => $v !== null));

        return response()->json(['data' => self::row($material->fresh('course'), true)]);
    }

    public function destroy(CourseMaterial $material)
    {
        if ($material->path) {
            Storage::disk('local')->delete($material->path);
        }
        $id = $material->course_id;
        $title = $material->title;
        $material->delete();

        AuditLog::record('course_material_deleted', 'course', $id, $title);

        return response()->json(['message' => 'Material removed.']);
    }

    private static function row(CourseMaterial $m, bool $staff = false): array
    {
        return [
            'id'          => $m->id,
            'course'      => $m->course?->only(['id', 'name', 'slug']),
            'type'        => $m->type,
            'title'       => $m->title,
            'description' => $m->description,
            'has_file'    => (bool) $m->path,
            'link_url'    => $m->link_url,
            'size_kb'     => $m->size_bytes ? (int) round($m->size_bytes / 1024) : null,
            'position'    => $m->position,
            'uploaded_at' => optional($m->created_at)->toDateString(),
            'is_published'=> $staff ? $m->is_published : null,
            'uploaded_by' => $staff ? $m->uploader?->name : null,
        ];
    }
}
