<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Support\BlogAi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * The Content tab's assistant: draft a post, generate a cover.
 *
 * Admin-only and throttled, because each call costs a provider request and
 * these are the only routes on the site that can spend money on someone else's
 * behalf. Every generation is written to the audit log with its topic, so
 * "where did this post come from" has an answer later.
 *
 * Nothing here writes a Post. The draft is handed back to the editor for a
 * human to read, change and decide to publish — which is the whole safeguard
 * on a machine writing copy for a business that has already had to delete two
 * rounds of invented claims.
 */
class AdminAiController extends Controller
{
    public function draft(Request $request)
    {
        $data = $request->validate([
            'topic' => 'required|string|max:500',
            'angle' => 'nullable|string|max:500',
            'words' => 'nullable|integer|min:300|max:1200',
        ]);

        $draft = BlogAi::draft($data['topic'], $data['angle'] ?? null, $data['words'] ?? 800);

        if (! $draft) {
            return response()->json(['message' => BlogAi::unavailableReason()], 503);
        }

        AuditLog::record('ai_post_drafted', 'post', null, $draft['title'], [
            'topic' => $data['topic'],
        ]);

        return response()->json(['data' => $draft]);
    }

    public function coverImage(Request $request)
    {
        $data = $request->validate([
            'subject' => 'required|string|max:400',
        ]);

        $url = BlogAi::coverImage($data['subject']);

        if (! $url) {
            return response()->json([
                'message' => 'Could not generate an image. Image generation needs billing enabled on the '
                    . 'Google account — the free tier allows none. You can still choose a shipped image.',
            ], 503);
        }

        AuditLog::record('ai_cover_generated', 'post', null, $data['subject']);

        return response()->json(['data' => ['image_url' => $url]]);
    }

    /**
     * Serve a generated cover. Same reasoning as the WhatsApp screenshots:
     * these are written at runtime, and the deploy wipes the docroot image
     * directories on every pull, so storage/ is the only place they survive.
     */
    public function serve(string $file)
    {
        $path = 'uploads/blog/' . basename($file);
        if (! Storage::disk('local')->exists($path)) abort(404);

        return response()->file(
            Storage::disk('local')->path($path),
            ['Cache-Control' => 'public, max-age=31536000, immutable']
        );
    }
}
