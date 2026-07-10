<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class NotificationController extends Controller {
    /** Latest notifications for the signed-in user + unread count. */
    public function index(Request $request) {
        $q = $request->user()->appNotifications();
        return response()->json([
            'unread' => (clone $q)->whereNull('read_at')->count(),
            'data'   => $q->latest()->limit(30)->get()->map(fn ($n) => [
                'id'         => $n->id,
                'type'       => $n->type,
                'title'      => $n->title,
                'body'       => $n->body,
                'read'       => $n->read_at !== null,
                'created_at' => $n->created_at->diffForHumans(),
            ]),
        ]);
    }

    public function markRead(Request $request, int $id) {
        $n = $request->user()->appNotifications()->findOrFail($id);
        $n->update(['read_at' => now()]);
        return response()->json(['message' => 'Read.']);
    }

    public function markAllRead(Request $request) {
        $request->user()->appNotifications()->whereNull('read_at')->update(['read_at' => now()]);
        return response()->json(['message' => 'All read.']);
    }
}
