<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class EventController extends Controller {
    /** Public: published events, upcoming first. */
    public function index() {
        return response()->json([
            'data' => Event::published()
                ->orderByRaw("CASE WHEN status = 'upcoming' THEN 0 ELSE 1 END")
                ->orderBy('starts_at')
                ->get(),
        ]);
    }

    public function show(string $slug) {
        $event = Event::published()->where('slug', $slug)->firstOrFail();
        $related = Event::published()->where('id', '!=', $event->id)->orderBy('starts_at')->limit(3)->get();
        return response()->json(['data' => $event, 'related' => $related]);
    }

    // ---- Staff Console CRUD ----
    public function adminIndex() {
        return response()->json(['data' => Event::orderByDesc('created_at')->get()]);
    }

    public function store(Request $request) {
        $data = $this->validated($request);
        $data['slug'] = $this->uniqueSlug($data['title']);
        return response()->json(Event::create($data), 201);
    }

    public function update(Request $request, Event $event) {
        $event->update($this->validated($request, partial: true));
        return response()->json($event->fresh());
    }

    public function destroy(Event $event) {
        $event->delete();
        return response()->json(['message' => 'Event deleted.']);
    }

    private function validated(Request $request, bool $partial = false): array {
        return $request->validate([
            'title'            => ($partial ? 'sometimes|' : '').'required|string|max:180',
            'icon'             => 'nullable|string|max:16',
            'category'         => 'nullable|string|max:80',
            'description'      => 'nullable|string|max:5000',
            'starts_at'        => 'nullable|date',
            'ends_at'          => 'nullable|date|after_or_equal:starts_at',
            'mode'             => 'nullable|string|max:40',
            'batch_size'       => 'nullable|string|max:40',
            'session_duration' => 'nullable|string|max:60',
            'schedule_note'    => 'nullable|string|max:200',
            'time_note'        => 'nullable|string|max:120',
            'status'           => 'nullable|in:upcoming,completed,draft',
        ]);
    }

    private function uniqueSlug(string $title): string {
        $base = Str::slug($title) ?: 'event';
        $slug = $base; $i = 2;
        while (Event::where('slug', $slug)->exists()) $slug = $base.'-'.$i++;
        return $slug;
    }
}
