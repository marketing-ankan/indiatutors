<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ReviewResource;
use App\Models\AuditLog;
use App\Models\Course;
use App\Models\DemoRequest;
use App\Models\Review;
use App\Models\Tutor;
use App\Support\TeacherPerformance;
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

    // ---- Public: teachers --------------------------------------------------

    /**
     * Approved reviews for one teacher, plus the aggregate and — for the
     * signed-in visitor — whether they may write one.
     *
     * `can_review` is answered here so the profile page never renders a form
     * that would be rejected. Until now that page shipped a form which called
     * setSent(true) and stored nothing: the exact lie this table was created
     * to end for courses, left in place for teachers.
     */
    public function tutorIndex(Request $request, string $slug)
    {
        // Scoped to published, matching TutorController::show — an unscoped
        // binding answered 200 for a draft or hidden teacher whose profile page
        // 404s, confirming the slug exists and leaving their review corpus
        // readable at a guessable URL.
        //
        // The POST route deliberately stays unscoped: it is already gated on a
        // demo the account provably attended, and a family must still be able
        // to review a teacher who was unpublished AFTER their demo.
        $tutor = Tutor::where('slug', $slug)->published()->firstOrFail();

        $approved = Review::approved()->where('tutor_id', $tutor->id);
        $userId   = $request->user('sanctum')?->id;
        $demo     = TeacherPerformance::reviewableDemo($userId, $tutor->id);

        return ReviewResource::collection($approved->clone()->latest()->paginate(10))
            ->additional([
                'summary' => [
                    'rating_count' => (int) $approved->clone()->count(),
                    'rating_avg'   => round((float) $approved->clone()->avg('rating'), 1),
                ],
                'can_review' => [
                    'allowed' => $demo !== null,
                    'demo_id' => $demo?->id,
                    // explainBlock, not reviewBlockedReason(null): the three
                    // reasons a demo is unreviewable read very differently to
                    // the parent, and "you already reviewed this" must not be
                    // reported as "you never had a demo".
                    'reason'  => $demo !== null ? null : TeacherPerformance::explainBlock($userId, $tutor->id),
                ],
            ]);
    }

    /**
     * Submit a review of a teacher. Requires a demo with this teacher that
     * actually took place — the gate is the demo, not a role check, so a
     * review can only ever describe a class the reviewer really attended.
     */
    public function storeForTutor(Request $request, Tutor $tutor)
    {
        $data = $request->validate([
            'rating'  => 'required|integer|min:1|max:5',
            'body'    => 'required|string|max:2000',
            'demo_id' => 'nullable|integer|exists:demo_requests,id',
        ]);

        $user       = $request->user();
        $suppliedId = $data['demo_id'] ?? null;
        $demo       = $suppliedId
            ? DemoRequest::find($suppliedId)
            : TeacherPerformance::reviewableDemo($user?->id, $tutor->id);

        // A demo_id that does not resolve must be blocked AS ITSELF. Asking
        // explainBlock here instead was a crash: it answers about the account's
        // history, not about this id, so for a parent who happened to hold some
        // other reviewable demo it returned "no reason" and the guard fell
        // through to dereference a null $demo — a 500 with the review lost.
        // The exists: rule above closes the ordinary case; this closes the race
        // where the row is deleted between validation and find().
        $reason = $demo !== null
            ? TeacherPerformance::reviewBlockedReason($user?->id, $demo, $tutor->id)
            : ($suppliedId
                ? TeacherPerformance::reviewBlockedReason($user?->id, null, $tutor->id)
                : TeacherPerformance::explainBlock($user?->id, $tutor->id));

        if ($reason) {
            return response()->json(['message' => $reason], 422);
        }

        // The unique index on demo_request_id is the real guard against a
        // double submit; this catch turns the race into the same friendly 422
        // the pre-check gives.
        try {
            Review::create([
                'tutor_id'        => $tutor->id,
                'demo_request_id' => $demo->id,
                'user_id'         => $user->id,
                // Reviews are signed with the account name, not a free-text
                // field: the reviewer is known here, unlike a guest course
                // review, and letting them type any name invites impersonation.
                'author_name'     => $user->name,
                'author_email'    => $user->email,
                'rating'          => $data['rating'],
                'body'            => $data['body'],
                'status'          => 'pending',
            ]);
        } catch (\Illuminate\Database\QueryException $e) {
            return response()->json(['message' => 'You have already reviewed this demo class.'], 422);
        }

        return response()->json([
            'message' => 'Thanks! Your review has been submitted for moderation.',
        ], 201);
    }

    // ---- Admin -------------------------------------------------------------

    public function adminIndex(Request $request)
    {
        $q = Review::query()->with(['course:id,name,slug', 'videoCourse:id,title,slug', 'tutor:id,name,slug'])->latest();

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
            // The table has always had tutor_id and the public site accepts tutor
            // reviews, but this endpoint had no rule for it — so a review a parent
            // phoned in about a teacher could not be recorded at all.
            'tutor_id'     => 'nullable|integer|exists:tutors,id',
            'author_name'  => 'required|string|max:120',
            'author_email' => 'nullable|email|max:180',
            'rating'       => 'required|integer|min:1|max:5',
            'body'         => 'required|string|max:2000',
            'status'       => 'nullable|in:pending,approved,rejected',
            // The console's "Add a review" form sends this — without a rule here
            // validate() strips it and the role line is silently lost, which is
            // the exact round-trip failure this field was added to avoid.
            'author_role'  => 'nullable|string|max:120',
        ]);

        // A review about nothing renders on no page. Both fields were optional
        // and the console's subject picker defaulted to "no specific course", so
        // the default action created a review that counted in the Reviews badge,
        // could be approved, and was invisible everywhere.
        if (empty($data['course_id']) && empty($data['tutor_id'])) {
            abort(422, 'Choose the course or the teacher this review is about — a review with neither appears on no page.');
        }

        // array_merge, not `+`: the union operator keeps the LEFT value when the
        // key exists, so an explicit "status": null passed validation (the rule
        // is nullable) and then defeated this very fallback, handing NULL to a
        // NOT NULL column.
        $review = Review::create(array_merge($data, [
            'status'     => $data['status'] ?: 'approved',
            'created_by' => $request->user()->id,
        ]));
        AuditLog::record('review_added', 'review', $review->id, $review->author_name);

        return (new ReviewResource($review->load(['course:id,name,slug', 'tutor:id,name,slug'])))
            ->response()->setStatusCode(201);
    }

    public function update(Request $request, Review $review)
    {
        $data = $request->validate([
            'rating' => 'sometimes|required|integer|min:1|max:5',
            'body'   => 'sometimes|required|string|max:2000',
            // "Unpublish" in the console sends status: pending — the review goes
            // back into the queue rather than being destroyed.
            'status' => 'sometimes|required|in:pending,approved,rejected',
            // Shortlists it for the home-page carousel.
            'is_featured' => 'sometimes|boolean',
            // "Parent, Kolkata · Class 8 Maths" — the line under the name on the
            // carousel card. Staff write it, because a reviewer does not supply
            // one and the placeholders it sits beside all have it.
            'author_role' => 'sometimes|nullable|string|max:120',
        ]);

        // Featuring something unapproved would put it on the front page while it
        // is still in the moderation queue.
        if (($data['is_featured'] ?? false) && ($data['status'] ?? $review->status) !== 'approved') {
            abort(422, 'Approve the review before showing it on the home page.');
        }

        $before         = $review->status;
        $featuredBefore = (bool) $review->is_featured;
        $review->update($data);

        // Un-approving pulls it off the home page too, rather than leaving a
        // withdrawn review featured and invisible in the queue.
        if (($data['status'] ?? $review->status) !== 'approved' && $review->is_featured) {
            $review->update(['is_featured' => false]);
        }

        if (isset($data['status']) && $data['status'] !== $before) {
            AuditLog::record('review_status', 'review', $review->id, $review->author_name, [
                'from' => $before, 'to' => $data['status'],
            ]);
        }

        // Publishing somebody's words to the busiest page on the site is a
        // decision worth a name against it — including the automatic unfeature
        // above, so a card vanishing from the home page is explainable.
        if ((bool) $review->fresh()->is_featured !== $featuredBefore) {
            AuditLog::record('review_featured', 'review', $review->id, $review->author_name, [
                'on_home_page' => !$featuredBefore,
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
