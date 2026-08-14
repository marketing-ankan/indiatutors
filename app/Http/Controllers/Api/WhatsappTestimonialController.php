<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\WhatsappTestimonial;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * The WhatsApp-style testimonial cards on the homepage and shop page.
 *
 * The demo copy ships in the front-end as a fallback; rows here are real
 * messages an admin published from the Content tab, and they replace the demo
 * cards from the front of the grid as they are added — the same one-by-one
 * retirement the owner chose for the review testimonials.
 */
class WhatsappTestimonialController extends Controller
{
    /**
     * Public grid. The table-exists guard is deliberate: this host kills deploy
     * jobs, so there is a real window where the code for this endpoint is live
     * before its migration has run — and this endpoint renders on the homepage,
     * which must degrade to the demo cards, not to a 500.
     */
    public function index()
    {
        if (!Schema::hasTable('whatsapp_testimonials')) return response()->json(['data' => []]);

        return response()->json(['data' => WhatsappTestimonial::published()
            ->orderBy('position')->orderBy('id')->limit(12)->get()
            ->map(fn ($t) => $this->present($t))]);
    }

    // --- Admin CRUD (routes sit behind the admin middleware) ---

    public function adminIndex()
    {
        if (!Schema::hasTable('whatsapp_testimonials')) return response()->json(['data' => []]);

        return response()->json(['data' => WhatsappTestimonial::orderBy('position')->orderBy('id')
            ->get()->map(fn ($t) => $this->present($t))]);
    }

    public function store(Request $request)
    {
        $data = $this->validated($request);
        $t = WhatsappTestimonial::create($data + ['created_by' => $request->user()->id]);
        AuditLog::record('whatsapp_testimonial_created', 'whatsapp_testimonial', $t->id, $t->name);
        // refresh(): the insert relies on the DB defaults for is_published and
        // position, and the in-memory model would report them as null.
        return response()->json(['data' => $this->present($t->refresh())], 201);
    }

    public function update(Request $request, WhatsappTestimonial $whatsappTestimonial)
    {
        $data = $this->validated($request, true);
        $whatsappTestimonial->update($data);
        AuditLog::record('whatsapp_testimonial_updated', 'whatsapp_testimonial',
            $whatsappTestimonial->id, $whatsappTestimonial->name, array_keys($data));
        return response()->json(['data' => $this->present($whatsappTestimonial->fresh())]);
    }

    public function destroy(WhatsappTestimonial $whatsappTestimonial)
    {
        AuditLog::record('whatsapp_testimonial_deleted', 'whatsapp_testimonial',
            $whatsappTestimonial->id, $whatsappTestimonial->name);
        $whatsappTestimonial->delete();
        return response()->json(['message' => 'Removed.']);
    }

    private function validated(Request $request, bool $partial = false): array
    {
        return $request->validate([
            'name'         => ($partial ? 'sometimes' : 'required').'|string|max:80',
            'text'         => ($partial ? 'sometimes' : 'required').'|string|max:500',
            'time_label'   => 'nullable|string|max:20',
            'is_published' => 'sometimes|boolean',
            'position'     => 'sometimes|integer|min:0|max:65535',
        ]);
    }

    private function present(WhatsappTestimonial $t): array
    {
        return [
            'id'           => $t->id,
            'name'         => $t->name,
            // Derived here so every consumer agrees on it — the chat bubble
            // shows a one-letter avatar exactly like the demo cards do.
            'init'         => Str::upper(Str::substr(trim($t->name), 0, 1)) ?: '?',
            'text'         => $t->text,
            'time_label'   => $t->time_label,
            'is_published' => $t->is_published,
            'position'     => $t->position,
            'created_at'   => optional($t->created_at)->toDateString(),
        ];
    }
}
