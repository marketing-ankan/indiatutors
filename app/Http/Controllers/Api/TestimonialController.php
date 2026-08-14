<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Review;

/**
 * The home-page testimonials — real ones, once there are any.
 *
 * The carousel has always rendered a hardcoded array. The owner kept those
 * placeholders deliberately, on the condition that a genuine review could be
 * approved and then appear here, with the invented ones retiring one by one as
 * real ones arrive. This is the endpoint that makes that possible.
 *
 * It returns only reviews a human has BOTH approved and shortlisted, so nothing
 * a visitor types can reach the front page on its own.
 */
class TestimonialController extends Controller
{
    /** How many the carousel shows. Beyond this the extras simply wait. */
    private const LIMIT = 12;

    public function index()
    {
        $reviews = Review::approved()->featured()
            ->with(['course:id,name', 'tutor:id,name'])
            ->latest('id')
            ->limit(self::LIMIT)
            ->get();

        return response()->json([
            'data' => $reviews->map(fn (Review $r) => [
                'id'     => $r->id,
                'name'   => $r->author_name,
                // Falls back to what the review is about, so a card never shows
                // a name with an empty line under it.
                'role'   => $r->author_role ?: $r->subject_name,
                'text'   => $r->body,
                'rating' => (int) $r->rating,
                // The placeholders use an initial in a coloured disc; a real
                // testimonial has to render identically or it will look like
                // the poor relation of the invented ones it replaces.
                'init'   => mb_strtoupper(mb_substr(trim((string) $r->author_name), 0, 1)) ?: '?',
            ])->values(),
        ]);
    }
}
