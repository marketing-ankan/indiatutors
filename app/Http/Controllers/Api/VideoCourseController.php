<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\VideoCourse;
use App\Models\VideoLesson;
use App\Support\CourseAi;
use App\Support\R2Video;
use App\Support\VideoSource;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

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
                    'unlocked'      => $unlocked,
                    'playback'      => $l->playbackUrl($unlocked),
                    'playback_kind' => $l->playbackKind(),
                    // Whether this lesson can host the study assistant. Never
                    // ship the transcript itself — it's the paid content.
                    'has_ai'        => $unlocked && CourseAi::enabledForLesson($l->transcript),
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
        return response()->json([
            'playback'      => $lesson->playbackUrl(true),
            'playback_kind' => $lesson->playbackKind(),
        ]);
    }

    /**
     * Study assistant: answer a question about one lesson. Same gate as
     * playback — buyers and free previews only — so the transcript can't be
     * mined by asking questions instead of watching.
     */
    public function ask(Request $request, VideoCourse $videoCourse, VideoLesson $lesson) {
        abort_unless($lesson->video_course_id === $videoCourse->id, 404);
        if (!$this->lessonUnlocked($request, $videoCourse, $lesson)) {
            return response()->json(['message' => 'Purchase this course to use the study assistant.'], 403);
        }
        if (!CourseAi::enabledForLesson($lesson->transcript)) {
            return response()->json(['message' => 'The study assistant isn\'t available for this lesson yet.'], 404);
        }

        $data = $request->validate(['question' => 'required|string|min:3|max:500']);
        $answer = CourseAi::answer($lesson->transcript, $lesson->title, $data['question']);

        return $answer === null
            ? response()->json(['message' => 'The assistant is unavailable right now — please try again in a moment.'], 503)
            : response()->json(['answer' => $answer]);
    }

    /**
     * F3 + F4 + F5 — explain a topic on the board.
     *
     * Same entitlement and transcript gates as ask(): a board is a generated
     * answer like any other, and it must not become a way to mine a paid
     * lesson without buying it.
     */
    public function explain(Request $request, VideoCourse $videoCourse, VideoLesson $lesson) {
        abort_unless($lesson->video_course_id === $videoCourse->id, 404);
        if (!$this->lessonUnlocked($request, $videoCourse, $lesson)) {
            return response()->json(['message' => 'Purchase this course to use the study assistant.'], 403);
        }
        if (!CourseAi::enabledForLesson($lesson->transcript)) {
            return response()->json(['message' => 'The study assistant isn\'t available for this lesson yet.'], 404);
        }

        $data  = $request->validate(['topic' => 'required|string|min:3|max:300']);
        $board = CourseAi::explain($lesson->transcript, $lesson->title, $data['topic']);

        // null covers both "provider failed" and "the lesson does not cover
        // this" — the student gets an honest sentence either way rather than a
        // board of invented steps.
        return $board === null
            ? response()->json(['message' => 'I could not build a board for that from this lesson. Try asking about something the lesson covers.'], 422)
            : response()->json(['board' => $board]);
    }

    /**
     * Study assistant: a recap of the lesson. Generated once and stored, so the
     * cost is one call per lesson for its lifetime rather than one per viewer.
     */
    public function summary(Request $request, VideoCourse $videoCourse, VideoLesson $lesson) {
        abort_unless($lesson->video_course_id === $videoCourse->id, 404);
        if (!$this->lessonUnlocked($request, $videoCourse, $lesson)) {
            return response()->json(['message' => 'Purchase this course to use the study assistant.'], 403);
        }
        if (!CourseAi::enabledForLesson($lesson->transcript)) {
            return response()->json(['message' => 'No summary for this lesson yet.'], 404);
        }

        if (!$lesson->ai_summary) {
            $generated = CourseAi::summarize($lesson->transcript, $lesson->title);
            if ($generated === null) {
                return response()->json(['message' => 'The assistant is unavailable right now — please try again in a moment.'], 503);
            }
            $lesson->forceFill(['ai_summary' => $generated])->save();
        }

        return response()->json(['summary' => $lesson->ai_summary]);
    }

    /**
     * Mint a direct-to-R2 upload URL for the Staff Console (admin only).
     *
     * The browser PUTs the file straight to R2 with this URL — the app server
     * signs and steps aside, so a 300 MB lesson never touches shared hosting.
     * We return the object key too: that's what gets stored on the lesson.
     */
    public function uploadUrl(Request $request, VideoCourse $videoCourse) {
        if (!R2Video::enabled()) {
            return response()->json(['message' => 'R2 is not configured — set the R2_* keys before uploading.'], 409);
        }

        $data = $request->validate([
            'filename'     => 'required|string|max:190',
            'content_type' => 'required|string|in:video/mp4,video/webm',
        ]);

        // Build the key ourselves rather than trusting the filename: keeps
        // traversal and odd characters out of the bucket, keeps it readable for
        // debugging, and the random suffix stops a re-upload of the same
        // filename silently overwriting a lesson that's already selling.
        $ext  = strtolower(pathinfo($data['filename'], PATHINFO_EXTENSION)) === 'webm' ? 'webm' : 'mp4';
        $base = Str::slug(pathinfo($data['filename'], PATHINFO_FILENAME)) ?: 'lesson';
        $key  = $videoCourse->slug . '/' . Str::limit($base, 60, '') . '-' . Str::lower(Str::random(6)) . '.' . $ext;

        return response()->json([
            'key'        => $key,
            'upload_url' => R2Video::signedPutUrl($key),
        ]);
    }

    /** Shared gate for the assistant endpoints: free preview, or an entitled buyer. */
    private function lessonUnlocked(Request $request, VideoCourse $course, VideoLesson $lesson): bool {
        return $lesson->is_preview || $course->ownedBy($request->user('sanctum'));
    }

    private function cardPayload(VideoCourse $c): array {
        return [
            // Needed client-side to address the per-lesson playback and study
            // assistant endpoints, which bind the course by id.
            'id'          => $c->id,
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

    /**
     * A YouTube lesson may be given as any watch / share / embed URL — that is
     * what the admin actually has in their hand. Normalise it to the bare id
     * before validation so `video_id` always holds what playbackUrl() embeds.
     */
    private function normaliseYouTube(Request $request): void {
        if ($request->input('provider') !== 'youtube') return;
        $raw = trim((string) $request->input('video_id', ''));
        if ($raw === '') return;
        $id = VideoSource::youtubeId($raw);
        if ($id === null) {
            throw ValidationException::withMessages([
                'video_id' => 'That does not look like a YouTube link or video id.',
            ]);
        }
        $request->merge(['video_id' => $id]);
    }

    /**
     * A YouTube video is public to anyone holding its id — "unlisted" is not
     * private. Selling a lesson hosted there would give the course away for
     * free, so YouTube is only ever allowed for a free preview.
     *
     * Forced rather than rejected, and applied on update as well as create:
     * rejecting would still let someone save a YouTube lesson as a preview and
     * then flip the flag off afterwards, which is the same leak by two steps.
     */
    private function forcePreviewForYouTube(array $data, ?VideoLesson $lesson = null): array {
        $provider = $data['provider'] ?? $lesson?->provider;
        if ($provider === 'youtube') $data['is_preview'] = true;
        return $data;
    }

    public function storeLesson(Request $request, VideoCourse $videoCourse) {
        $this->normaliseYouTube($request);
        $data = $request->validate([
            'title'            => 'required|string|max:190',
            'provider'         => 'required|in:bunny,youtube,r2',
            'video_id'         => 'required|string|max:255',
            'duration_seconds' => 'nullable|integer|min:0',
            'transcript'       => 'nullable|string|max:200000',
            'is_preview'       => 'nullable|boolean',
            'position'         => 'nullable|integer',
        ]);
        $data = $this->forcePreviewForYouTube($data);
        $data['position'] ??= ($videoCourse->lessons()->max('position') ?? -1) + 1;
        return response()->json($videoCourse->lessons()->create($data), 201);
    }

    public function updateLesson(Request $request, VideoCourse $videoCourse, VideoLesson $lesson) {
        abort_unless($lesson->video_course_id === $videoCourse->id, 404);
        $this->normaliseYouTube($request);
        $data = $request->validate([
            'title'            => 'sometimes|required|string|max:190',
            'provider'         => 'sometimes|required|in:bunny,youtube,r2',
            'video_id'         => 'sometimes|required|string|max:255',
            'duration_seconds' => 'nullable|integer|min:0',
            'transcript'       => 'nullable|string|max:200000',
            'is_preview'       => 'nullable|boolean',
            'position'         => 'nullable|integer',
        ]);
        // A changed transcript invalidates the cached recap — drop it so the next
        // reader regenerates from the current text rather than the old lesson.
        if (array_key_exists('transcript', $data) && $data['transcript'] !== $lesson->transcript) {
            $data['ai_summary'] = null;
        }
        $data = $this->forcePreviewForYouTube($data, $lesson);
        $lesson->update($data);
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
