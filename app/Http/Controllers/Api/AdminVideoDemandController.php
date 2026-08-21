<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\VideoCourseRequest;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * What people want recorded, and how badly.
 *
 * Its own controller rather than another method on AdminController, which is
 * already the largest file in the app and carries nine unrelated concerns.
 *
 * The headline is the RANKING, not the list. A hundred individual rows tell
 * nobody what to record next; "Class 10 Physics — 34 people, 9 of them left an
 * email" is a production decision. The list exists underneath it for reading
 * the actual words people used, which is where the surprises are.
 */
class AdminVideoDemandController extends Controller
{
    /**
     * Demand grouped by normalised subject, strongest first.
     *
     * Grouped in SQL on the stored subject_key rather than in PHP, so this
     * stays one query as the table grows — this is a report that gets opened
     * repeatedly and never gets smaller.
     */
    public function insights(Request $request)
    {
        $since = $request->filled('days')
            ? now()->subDays(min(365, max(1, (int) $request->input('days'))))
            : null;

        $base = VideoCourseRequest::query()
            ->when($since, fn ($q) => $q->where('created_at', '>=', $since));

        $top = (clone $base)
            ->selectRaw('subject_key, COUNT(*) as requests')
            ->selectRaw('SUM(CASE WHEN notify_me = 1 THEN 1 ELSE 0 END) as waiting_to_hear')
            ->selectRaw('MAX(created_at) as latest')
            ->whereNotNull('subject_key')->where('subject_key', '!=', '')
            ->groupBy('subject_key')
            ->orderByDesc('requests')
            ->limit(25)
            ->get();

        // One real example per group, so staff read the words a person actually
        // typed rather than the normalised key. A key like "math physic" is fine
        // for counting and useless for understanding what was meant.
        $examples = VideoCourseRequest::query()
            ->whereIn('subject_key', $top->pluck('subject_key'))
            ->orderByDesc('id')
            ->get(['subject_key', 'subject', 'level'])
            ->groupBy('subject_key');

        return response()->json(['data' => [
            'total'    => (clone $base)->count(),
            'people'   => (clone $base)->whereNotNull('email')->distinct('email')->count('email'),
            'notify'   => (clone $base)->where('notify_me', true)->count(),
            'ranking'  => $top->map(fn ($r) => [
                'subject_key'     => $r->subject_key,
                'example'         => $examples[$r->subject_key][0]->subject ?? $r->subject_key,
                'level'           => $examples[$r->subject_key][0]->level ?? null,
                'requests'        => (int) $r->requests,
                'waiting_to_hear' => (int) $r->waiting_to_hear,
                'latest'          => $r->latest,
            ])->all(),
        ]]);
    }

    public function index(Request $request)
    {
        $q = VideoCourseRequest::query()
            ->with(['videoCourse:id,title,slug', 'user:id,name,email'])
            ->when($request->filled('status'), fn ($b) => $b->where('status', $request->string('status')))
            ->when($request->filled('subject_key'), fn ($b) => $b->where('subject_key', $request->string('subject_key')))
            ->when($request->filled('q'), function ($b) use ($request) {
                $term = '%' . $request->string('q') . '%';
                $b->where(fn ($w) => $w->where('subject', 'like', $term)
                    ->orWhere('name', 'like', $term)->orWhere('email', 'like', $term)
                    ->orWhere('message', 'like', $term));
            })
            ->latest();

        $page = $q->paginate(25);
        $page->getCollection()->transform(fn ($r) => [
            'id'         => $r->id,
            'subject'    => $r->subject,
            'level'      => $r->level,
            'message'    => $r->message,
            'name'       => $r->name ?: $r->user?->name,
            'email'      => $r->email ?: $r->user?->email,
            'phone'      => $r->phone,
            'notify_me'  => (bool) $r->notify_me,
            'status'     => $r->status,
            'has_account'=> (bool) $r->user_id,
            'from_course'=> $r->videoCourse?->title,
            'created_at' => $r->created_at?->toIso8601String(),
        ]);

        return response()->json([
            'data' => $page->items(),
            'meta' => [
                'current_page' => $page->currentPage(),
                'last_page'    => $page->lastPage(),
                'total'        => $page->total(),
            ],
        ]);
    }

    public function update(Request $request, VideoCourseRequest $videoCourseRequest)
    {
        $data = $request->validate([
            'status' => ['required', Rule::in(VideoCourseRequest::STATUSES)],
        ]);

        $videoCourseRequest->update($data);
        AuditLog::record('video_demand_status', 'video_course_request', $videoCourseRequest->id,
            $videoCourseRequest->subject, $data);

        return response()->json(['message' => 'Updated.']);
    }
}
