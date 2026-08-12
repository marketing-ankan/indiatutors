<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LegalDocument;
use App\Support\SiteSettings;

/**
 * Public policy pages, served from the database instead of the JS bundle.
 *
 * The frontend keeps its bundled copy as a fallback and only uses this when the
 * request succeeds. A policy page that renders blank because an API call failed
 * would be worse than a slightly stale one: these are the documents a visitor
 * is told to read before paying, and the footer links to them from every page.
 */
class LegalController extends Controller
{
    /** The footer's "Related Policies" list — label + path, in document order. */
    public function index()
    {
        return response()->json([
            'data' => LegalDocument::published()
                ->orderBy('position')->orderBy('id')
                ->get(['key', 'slug', 'title'])
                ->map(fn ($d) => ['key' => $d->key, 'slug' => $d->slug, 'title' => $d->title]),
        ]);
    }

    public function show(string $slug)
    {
        $doc = LegalDocument::published()->where('slug', $slug)->first()
            ?? LegalDocument::published()->where('key', $slug)->firstOrFail();

        $entity = SiteSettings::get('entity_name');

        return response()->json(['data' => [
            'key'       => $doc->key,
            'slug'      => $doc->slug,
            'title'     => $doc->title,
            'eyebrow'   => $doc->eyebrow,
            'updated'   => $doc->updated_label,
            'effective' => $doc->effective_label,
            'intro'     => SiteSettings::applyEntity($doc->intro, $entity),
            'glance'    => SiteSettings::applyEntity($doc->glance ?? [], $entity),
            'sections'  => SiteSettings::applyEntity($doc->sections ?? [], $entity),
            'contact'   => SiteSettings::applyEntity($doc->contact ?? [], $entity),
        ]]);
    }
}
