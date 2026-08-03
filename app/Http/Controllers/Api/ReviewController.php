<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ReviewResource;
use App\Models\AuditLog;
use App\Models\Course;
use App\Models\Review;
use Illuminate\Http\Request;

// Public submission + staff moderation in one file, the same way
// TeacherApplicationController pairs its public store() with its admin methods.
//
// Nothing a visitor writes is published on submission: reviews land as
// `pending` and only an admin can approve them.
class ReviewController extends Controller
{
    // ---- Public ------------------------------------------------------------

    /** Approved reviews for one course, plus the aggregate the page displays. */
    public function index(Course $course)
    {
        $approved = $course->approvedReviews();

        // Deliberately not 'meta': a paginated resource collection already owns
        // that key, and overwriting it would break the pager.
        return ReviewResource::collection($approved->clone()->latest()->paginate(10))
            ->additional(['summary' => [
                'rating_count' => (int) $approved->clone()->count(),
                'rating_avg'   => round((float) $approved->clone()->avg('rating'), 1),
            ]]);
    }

    public function store(Request $request, Course $course)
    {
        $data = $request->validate([
            'author_name'  => 'required|string|max:120',
            'author_email' => 'nullable|email|max:180',
            'rating'       => 'required|integer|min:1|max:5',
            'body'         => 'required|string|max:2000',
        ]);

        Review::create($data + [
            'course_id' => $course->id,
            'user_id'   => $request->user('sanctum')?->id,
            'status'    => 'pending',
        ]);

        return response()->json([
            'message' => 'Thanks! Your review has been submitted for moderation.',
        ], 201);
    }

    // ---- Admin -------------------------------------------------------------

    public function adminIndex(Request $request)
    {
        $q = Review::query()->with(['course:id,name,slug', 'videoCourse:id,title,slug'])->latest();

        if ($status = $request->string('status')->toString()) $q->where('status', $status);
        if ($s = trim($request->string('q')->toString())) {
            $q->where(fn ($w) => $w->where('author_name', 'like', "%{$s}%")->orWhere('body', 'like', "%{$s}%"));
        }

        return ReviewResource::collection($q->paginate(20));
    }

    /** Staff-entered review (e.g. transcribing one that arrived by email). */
    public function adminStore(Request $request)
    {
        $data = $request->validate([
            'course_id'    => 'nullable|integer|exists:courses,id',
            'author_name'  => 'required|string|max:120',
            'author_email' => 'nullable|email|max:180',
            'rating'       => 'required|integer|min:1|max:5',
            'body'         => 'required|string|max:2000',
            'status'       => 'nullable|in:pending,approved,rejected',
        ]);

        $review = Review::create($data + [
            'status'     => $data['status'] ?? 'approved',
            'created_by' => $request->user()->id,
        ]);
        AuditLog::record('review_added', 'review', $review->id, $review->author_name);

        return (new ReviewResource($review->load('course:id,name,slug')))->response()->setStatusCode(201);
    }

    public function update(Request $request, Review $review)
    {
        $data = $request->validate([
            'rating' => 'sometimes|required|integer|min:1|max:5',
            'body'   => 'sometimes|required|string|max:2000',
            // "Unpublish" in the console sends status: pending — the review goes
            // back into the queue rather than being destroyed.
            'status' => 'sometimes|required|in:pending,approved,rejected',
        ]);

        $before = $review->status;
        $review->update($data);

        if (isset($data['status']) && $data['status'] !== $before) {
            AuditLog::record('review_status', 'review', $review->id, $review->author_name, [
                'from' => $before, 'to' => $data['status'],
            ]);
        }

        return new ReviewResource($review->fresh()->load('course:id,name,slug'));
    }

    public function destroy(Review $review)
    {
        $label = $review->author_name;
        $id    = $review->id;
        $review->delete();
        AuditLog::record('review_deleted', 'review', $id, $label);

        return response()->json(['message' => 'Review deleted.']);
    }
}
