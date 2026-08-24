<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Course;
use App\Models\CourseMaterial;
use App\Models\MaterialHandover;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
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
    /**
     * Material for every course this account is entitled to, grouped by course,
     * plus a final group for files a teacher handed over directly.
     *
     * A handed-over file the reader is ALSO enrolled for stays in its course
     * group and simply carries its attribution — listing it twice would have a
     * student ticking off the same deck in two places. Only a file they could
     * not otherwise see gets its own group, which is exactly the set that would
     * have been invisible before this feature.
     */
    public function mine(Request $request)
    {
        $user      = $request->user();
        $courseIds = CourseMaterial::courseIdsFor($user);
        $handovers = self::visibleHandovers($user);

        $rows = CourseMaterial::query()
            ->published()
            ->with('course:id,name,slug')
            ->when($courseIds !== null, fn ($q) => $q->where(function ($w) use ($courseIds, $handovers) {
                $w->whereIn('course_id', $courseIds);
                if ($handovers->isNotEmpty()) {
                    $w->orWhereIn('id', $handovers->keys()->all());
                }
            }))
            ->orderBy('course_id')->orderBy('position')->orderBy('id')
            ->get();

        $inCourse = fn (CourseMaterial $m) => $courseIds === null
            || in_array($m->course_id, $courseIds, true);

        // One entry per HANDOVER here too, not per material. A guardian with two
        // children who are both enrolled on this course and were both sent the
        // same file has two deliveries to track, and attaching only the first
        // reported one child's state while silently dropping the other's.
        $withHandovers = function (CourseMaterial $m) use ($handovers) {
            $hs = $handovers->get($m->id);

            return $hs && $hs->isNotEmpty()
                ? $hs->map(fn ($h) => self::row($m) + ['handover' => self::handoverRow($h)])->all()
                : [self::row($m) + ['handover' => null]];
        };

        $groups = $rows->filter($inCourse)->groupBy('course_id')->map(fn ($items) => [
            'group'     => 'course',
            'course'    => $items->first()->course?->only(['id', 'name', 'slug']),
            'materials' => $items->flatMap($withHandovers)->values()->all(),
        ])->values();

        // One entry per HANDOVER rather than per material, so a guardian with two
        // children who were each sent the same file sees two rows, each naming
        // the child it concerns.
        $handedOver = $rows->reject($inCourse)
            ->flatMap(fn (CourseMaterial $m) => ($handovers->get($m->id) ?? collect())
                ->map(fn ($h) => self::row($m) + ['handover' => self::handoverRow($h)]))
            ->values()->all();

        if ($handedOver) {
            $groups->push(['group' => 'handover', 'course' => null, 'materials' => $handedOver]);
        }

        return response()->json(['data' => $groups->values()->all()]);
    }

    /**
     * Download. Entitlement is re-checked here rather than trusted from the
     * listing — the id is guessable, and a link that outlives an enrolment is
     * exactly what storing files privately is meant to prevent.
     */
    public function download(Request $request, CourseMaterial $material)
    {
        $user = $request->user();
        abort_unless($material->readableBy($user),
            403, 'This material is for a course you are not enrolled in.');
        // Unpublished material is staff-only even for an enrolled learner.
        abort_unless($material->is_published || $user->isAdmin(), 404, 'Not available.');
        abort_unless($material->path && Storage::disk('local')->exists($material->path), 404, 'No file attached.');

        self::stampDownload($user, $material);

        return Storage::disk('local')->download($material->path, $material->original_name ?? $material->title);
    }

    /**
     * Record that the person a file was handed to has opened it.
     *
     * Only when the reader IS the addressee. A guardian downloading a file
     * addressed to their child's own login is not the child downloading it, and
     * the parent screen and the admin trail both publish that stamp as the
     * learner's own act.
     */
    private static function stampDownload($user, CourseMaterial $material): void
    {
        $handover = self::visibleHandovers($user)->get($material->id)
            ?->firstWhere('to_user_id', $user->id);
        if (! $handover) {
            return;
        }

        $handover->forceFill([
            'downloaded_at'  => now(),
            'download_count' => (int) $handover->download_count + 1,
        ])->save();
    }

    /**
     * Handovers this reader may see, grouped by material id.
     *
     * Degrades to nothing while material_handovers is missing — this method sits
     * on a learner's materials list and on every download, both of which worked
     * before handovers existed and must keep working through a deploy whose
     * `migrate` has not landed yet. MaterialHandover::ready explains the host.
     */
    private static function visibleHandovers($user): Collection
    {
        $q = MaterialHandover::visibleTo($user);
        if (! $q) {
            return collect();
        }

        return $q->whereNotNull('course_material_id')
            ->with(['sender:id,name', 'student:id,name'])
            ->orderBy('created_at')->orderBy('id')
            ->get()->groupBy('course_material_id');
    }

    /**
     * The same delivery facts the teacher's panel and the admin trail publish.
     *
     * The download stamps are here for the parent screen, which is the one
     * audience that watches delivery rather than performing it: without them its
     * row tops out at "Opened" while the console next door says "Downloaded"
     * about the very same handover, and the "N× downloaded" line can never fire.
     * Keep this in step with MaterialHandoverController::handovers().
     */
    private static function handoverRow(?MaterialHandover $h): ?array
    {
        return $h ? [
            'id'              => $h->id,
            'sent_by'         => $h->sender?->name,
            'sent_at'         => optional($h->created_at)->toDateString(),
            'first_viewed_at' => optional($h->first_viewed_at)->toDateString(),
            'downloaded_at'   => optional($h->downloaded_at)->toDateString(),
            'download_count'  => (int) $h->download_count,
            'note'            => $h->note,
            'student'         => $h->student?->name,
        ] : null;
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

        // Publishing is the act that makes a file visible to every teacher and
        // family entitled to the course, and the console tells its operators
        // that every change here is recorded. Adding and deleting were audited;
        // this — the highest blast radius of the three — was not.
        AuditLog::record('course_material_updated', 'course', $material->course_id,
            Course::find($material->course_id)?->name, [
                'title'        => $material->title,
                'is_published' => (bool) $material->is_published,
            ]);

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
            'size_kb'     => $m->sizeKb(),
            'position'    => $m->position,
            'uploaded_at' => optional($m->created_at)->toDateString(),
            'is_published'=> $staff ? $m->is_published : null,
            'uploaded_by' => $staff ? $m->uploader?->name : null,
        ];
    }
}
