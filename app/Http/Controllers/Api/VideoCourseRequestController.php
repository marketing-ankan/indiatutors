<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\VideoCourseRequest;
use App\Support\LeadNotifier;
use Illuminate\Http\Request;

/**
 * "Tell us which recorded course to make." Public, unauthenticated.
 *
 * Only the subject is required. A form that demands a name, an email and a
 * phone number before it will accept "please do Class 10 Physics" collects
 * almost nothing, because the person filling it in gets nothing back today —
 * the course does not exist yet. The cheap answer is the one worth having, and
 * anyone who does leave contact details is asking to be told when it lands.
 */
class VideoCourseRequestController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'subject'         => ['required', 'string', 'min:2', 'max:190'],
            'level'           => ['nullable', 'string', 'max:60'],
            'name'            => ['nullable', 'string', 'max:120'],
            'email'           => ['nullable', 'email', 'max:190'],
            'phone'           => ['nullable', 'string', 'max:30'],
            'message'         => ['nullable', 'string', 'max:2000'],
            'video_course_id' => ['nullable', 'integer', 'exists:video_courses,id'],
            'notify_me'       => ['nullable', 'boolean'],
        ]);

        // auth('sanctum'), not $request->user(): this route is deliberately
        // public, and on a route with no auth middleware $request->user() is
        // null even when the caller sent a perfectly good bearer token. Every
        // signed-in visitor was being recorded as anonymous. Same idiom as the
        // other public lead forms — ContactController, DemoRequestController.
        $user = auth('sanctum')->user();

        $data['user_id'] = $user?->id;
        if ($user) {
            // ?? not ?:, because validate() only returns the keys that were
            // SENT. Every one of these fields is optional, so reading them
            // directly fataled for the commonest case there is: someone signed
            // in who filled in nothing but the subject.
            $data['name']  = ($data['name']  ?? null) ?: $user->name;
            $data['email'] = ($data['email'] ?? null) ?: $user->email;
        }

        // Decided AFTER the account email is filled in, not before. Ordered the
        // other way round, a signed-in person who ticked "tell me when it
        // launches" had that consent thrown away — we hold their address, they
        // asked to be written to, and the flag still came out false.
        //
        // The rule itself stands: consent needs somewhere to deliver to, or the
        // list cannot be sent and reads later as agreement we never obtained.
        $data['notify_me'] = ! empty($data['notify_me']) && ! empty($data['email']);

        $req = VideoCourseRequest::create($data);

        // Staff alert only — internal routing, the same call the other lead
        // forms make. Nobody is promised a reply here, so this does not create
        // a support ticket and does not enter any "needs a reply" queue.
        LeadNotifier::announce('video_demand', 'Someone asked for a recorded course', [
            'Subject' => $req->subject,
            'Level'   => $req->level,
            'From'    => $req->name ?: 'Not given',
            'Contact' => $req->email ?: $req->phone ?: 'Not given',
        ], '/admin#ac-videos');

        return response()->json([
            'message' => 'Thanks — noted. The more people ask for a subject, the sooner we record it.',
            'data'    => ['id' => $req->id, 'subject' => $req->subject],
        ], 201);
    }
}
