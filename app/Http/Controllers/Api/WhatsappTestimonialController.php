<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\WhatsappTestimonial;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

/**
 * The WhatsApp Testimonials section: real screenshots of WhatsApp chats,
 * uploaded and curated from the Content tab.
 *
 * Screenshots are the one image type on this site that CANNOT ride in the git
 * repo like all other artwork: they arrive from the owner's phone, not from a
 * designer's commit. So they upload into storage/ — the only directory the
 * deploy never wipes — and are served back through serve() below rather than
 * from the docroot. The front-end shows its demo cards until the first real
 * screenshot is published, then switches to the real ones outright: a mock
 * chat bubble standing next to a genuine screenshot would read as fake.
 */
class WhatsappTestimonialController extends Controller
{
    private const DIR = 'uploads/whatsapp';

    /**
     * Public list. The table-exists guard is deliberate: this host kills
     * deploy jobs, so there is a real window where this endpoint is live
     * before its migration has run — and it renders on the homepage, which
     * must degrade to the demo cards, not to a 500.
     */
    public function index()
    {
        if (!Schema::hasTable('whatsapp_testimonials')) return response()->json(['data' => []]);

        return response()->json(['data' => WhatsappTestimonial::published()
            ->orderBy('position')->orderBy('id')->limit(12)->get()
            ->map(fn ($t) => $this->present($t))]);
    }

    /**
     * The screenshot itself. Filenames are the hashed names store() minted, so
     * they are unguessable, immutable and safe to cache hard. The regex on the
     * route plus basename() here means nothing outside the upload directory is
     * reachable, whatever the request says.
     */
    public function serve(string $file)
    {
        $path = self::DIR . '/' . basename($file);
        if (!Storage::disk('local')->exists($path)) abort(404);

        return response()->file(
            Storage::disk('local')->path($path),
            ['Cache-Control' => 'public, max-age=31536000, immutable']
        );
    }

    // --- Admin CRUD (routes sit behind the admin middleware) ---

    public function adminIndex()
    {
        if (!Schema::hasTable('whatsapp_testimonials')) return response()->json(['data' => []]);

        return response()->json(['data' => WhatsappTestimonial::orderBy('position')->orderBy('id')
            ->get()->map(fn ($t) => $this->present($t))]);
    }

    /** Multipart: the screenshot file plus its optional label and order. */
    public function store(Request $request)
    {
        $data = $request->validate([
            'image'    => 'required|image|max:4096',   // jpeg/png/webp/gif, ≤4 MB
            'label'    => 'nullable|string|max:120',
            'position' => 'sometimes|integer|min:0|max:65535',
        ]);

        $path = $request->file('image')->store(self::DIR, 'local');

        $t = WhatsappTestimonial::create([
            'image_path' => $path,
            'label'      => $data['label'] ?? null,
            'position'   => $data['position'] ?? 0,
            'created_by' => $request->user()->id,
        ]);
        AuditLog::record('whatsapp_testimonial_created', 'whatsapp_testimonial', $t->id, $t->label ?? basename($path));

        // refresh(): the insert relies on the DB defaults for is_published,
        // and the in-memory model would report it as null.
        return response()->json(['data' => $this->present($t->refresh())], 201);
    }

    /**
     * Label, order and visibility only — JSON, no file. PHP does not parse
     * multipart bodies on PATCH, and a screenshot has no meaningful "edit"
     * anyway: to change the image, delete the card and upload the right one.
     */
    public function update(Request $request, WhatsappTestimonial $whatsappTestimonial)
    {
        $data = $request->validate([
            'label'        => 'sometimes|nullable|string|max:120',
            'is_published' => 'sometimes|boolean',
            'position'     => 'sometimes|integer|min:0|max:65535',
        ]);
        $whatsappTestimonial->update($data);
        AuditLog::record('whatsapp_testimonial_updated', 'whatsapp_testimonial',
            $whatsappTestimonial->id, $whatsappTestimonial->label ?? basename($whatsappTestimonial->image_path), array_keys($data));
        return response()->json(['data' => $this->present($whatsappTestimonial->fresh())]);
    }

    public function destroy(WhatsappTestimonial $whatsappTestimonial)
    {
        AuditLog::record('whatsapp_testimonial_deleted', 'whatsapp_testimonial',
            $whatsappTestimonial->id, $whatsappTestimonial->label ?? basename($whatsappTestimonial->image_path));
        // Row first, file second: a leaked file is invisible clutter, but a
        // dangling row would render a broken image on the homepage.
        $path = $whatsappTestimonial->image_path;
        $whatsappTestimonial->delete();
        Storage::disk('local')->delete($path);
        return response()->json(['message' => 'Removed.']);
    }

    private function present(WhatsappTestimonial $t): array
    {
        return [
            'id'           => $t->id,
            'image_url'    => '/api/media/whatsapp/' . basename($t->image_path),
            'label'        => $t->label,
            'is_published' => $t->is_published,
            'position'     => $t->position,
            'created_at'   => optional($t->created_at)->toDateString(),
        ];
    }
}
