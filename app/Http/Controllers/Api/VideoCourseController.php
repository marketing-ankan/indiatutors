<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\VideoCourse;
use App\Models\VideoLesson;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class VideoCourseController extends Controller {
    /** Public catalog. */
    public function index() {
        $courses = VideoCourse::published()->withCount('lessons')->orderBy('position')->orderBy('title')->get()
            ->map(fn ($c) => $this->cardPayload($c));
        return response()->json(['data' => $courses]);
    }

    /**
     * Course detail with its playlist. Each lesson reports whether it's unlocked
     * for the current viewer (free preview, or an owned/entitled paid lesson).
     * Playback URLs are only returned for unlocked lessons.
     */
    public function show(Request $request, string $slug) {
        $course = VideoCourse::published()->with('lessons')->where('slug', $slug)->firstOrFail();
        // Public route: resolve the buyer from a bearer token if one is present.
        $owned = $course->ownedBy($request->user('sanctum'));
        return response()->json([
            'data'  => $this->cardPayload($course) + [
                'description' => $course->description,
                'owned'       => $owned,
            ],
            'lessons' => $course->lessons->map(function (VideoLesson $l) use ($owned) {
                $unlocked = $owned || $l->is_preview;
                return [
                    'id'         => $l->id,
                    'title'      => $l->title,
                    'duration'   => $l->duration_seconds,
                    'is_preview' => $l->is_preview,
                    'unlocked'   => $unlocked,
                    'playback'   => $l->playbackUrl($unlocked),
                ];
            }),
        ]);
    }

    /** The signed-in user's purchased video courses (dashboard "My Courses"). */
    public function myCourses(Request $request) {
        $ids = $request->user()->videoEntitlements()->pluck('video_course_id');
        $courses = VideoCourse::whereIn('id', $ids)->withCount('lessons')->orderBy('title')->get()
            ->map(fn ($c) => $this->cardPayload($c));
        return response()->json(['data' => $courses]);
    }

    /** Signed playback for a single lesson — the gate. */
    public function playback(Request $request, VideoCourse $videoCourse, VideoLesson $lesson) {
        abort_unless($lesson->video_course_id === $videoCourse->id, 404);
        $unlocked = $lesson->is_preview || $videoCourse->ownedBy($request->user('sanctum'));
        if (!$unlocked) return response()->json(['message' => 'Purchase this course to watch this lesson.'], 403);
        return response()->json(['playback' => $lesson->playbackUrl(true)]);
    }

    private function cardPayload(VideoCourse $c): array {
        return [
            'slug'        => $c->slug,
            'title'       => $c->title,
            'subtitle'    => $c->subtitle,
            'price'       => $c->price,
            'level'       => $c->level,
            'category'    => $c->category,
            'thumbnail'   => $c->thumbnail_url,
            'lesson_count'=> $c->lessons_count ?? $c->lessons()->count(),
        ];
    }

    // ---------------- Staff Console ----------------
    public function adminIndex() {
        return response()->json(['data' => VideoCourse::withCount('lessons')->orderBy('position')->get()]);
    }

    public function store(Request $request) {
        $data = $this->validated($request);
        $data['slug'] = $this->uniqueSlug($data['title']);
        return response()->json(VideoCourse::create($data), 201);
    }

    public function update(Request $request, VideoCourse $videoCourse) {
        $videoCourse->update($this->validated($request, true));
        return response()->json($videoCourse->fresh());
    }

    public function destroy(VideoCourse $videoCourse) {
        $videoCourse->delete();
        return response()->json(['message' => 'Video course deleted.']);
    }

    public function lessons(VideoCourse $videoCourse) {
        return response()->json(['data' => $videoCourse->lessons]);
    }

    public function storeLesson(Request $request, VideoCourse $videoCourse) {
        $data = $request->validate([
            'title'            => 'required|string|max:190',
            'provider'         => 'required|in:bunny,youtube',
            'video_id'         => 'required|string|max:120',
            'duration_seconds' => 'nullable|integer|min:0',
            'is_preview'       => 'nullable|boolean',
            'position'         => 'nullable|integer',
        ]);
        $data['position'] ??= ($videoCourse->lessons()->max('position') ?? -1) + 1;
        return response()->json($videoCourse->lessons()->create($data), 201);
    }

    public function updateLesson(Request $request, VideoCourse $videoCourse, VideoLesson $lesson) {
        abort_unless($lesson->video_course_id === $videoCourse->id, 404);
        $lesson->update($request->validate([
            'title'            => 'sometimes|required|string|max:190',
            'provider'         => 'sometimes|required|in:bunny,youtube',
            'video_id'         => 'sometimes|required|string|max:120',
            'duration_seconds' => 'nullable|integer|min:0',
            'is_preview'       => 'nullable|boolean',
            'position'         => 'nullable|integer',
        ]));
        return response()->json($lesson->fresh());
    }

    public function destroyLesson(VideoCourse $videoCourse, VideoLesson $lesson) {
        abort_unless($lesson->video_course_id === $videoCourse->id, 404);
        $lesson->delete();
        return response()->json(['message' => 'Lesson deleted.']);
    }

    private function validated(Request $request, bool $partial = false): array {
        return $request->validate([
            'title'        => ($partial ? 'sometimes|' : '').'required|string|max:190',
            'subtitle'     => 'nullable|string|max:255',
            'description'  => 'nullable|string|max:5000',
            'price'        => 'nullable|integer|min:0',
            'level'        => 'nullable|string|max:40',
            'category'     => 'nullable|string|max:80',
            'thumbnail_url'=> 'nullable|url|max:500',
            'position'     => 'nullable|integer',
            'is_published' => 'nullable|boolean',
        ]);
    }

    private function uniqueSlug(string $title): string {
        $base = Str::slug($title) ?: 'video-course';
        $slug = $base; $i = 2;
        while (VideoCourse::where('slug', $slug)->exists()) $slug = $base.'-'.$i++;
        return $slug;
    }
}
