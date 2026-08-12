<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\LegalDocument;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Editing the policy pages from the Staff Console.
 *
 * The body is validated STRUCTURALLY, not just "is it an array": a policy page
 * that renders nothing because a block lost its `type` is a silent failure on
 * the documents a customer is told to read before paying. Every block must be
 * one of the seven types LegalPage.jsx can draw, with the fields that type
 * needs — anything else is rejected with a message naming the section.
 *
 * Slugs are editable but must stay unique: they are the public URLs, linked
 * from the footer of every page and, for the refund policy, from payment
 * receipts.
 */
class AdminLegalController extends Controller
{
    /** The block types LegalPage.jsx can render, and the fields each one needs. */
    private const BLOCK_TYPES = ['p', 'list', 'olist', 'defs', 'table', 'steps', 'note'];

    public function index()
    {
        return response()->json([
            'data' => LegalDocument::orderBy('position')->orderBy('id')->get(),
        ]);
    }

    public function show(LegalDocument $document)
    {
        return response()->json(['data' => $document]);
    }

    public function update(Request $request, LegalDocument $document)
    {
        $data = $request->validate([
            'title'           => 'sometimes|required|string|max:190',
            'slug'            => ['sometimes', 'required', 'string', 'max:80', 'regex:/^[a-z0-9-]+$/',
                                  Rule::unique('legal_documents', 'slug')->ignore($document->id)],
            'eyebrow'         => 'nullable|string|max:60',
            'updated_label'   => 'nullable|string|max:60',
            'effective_label' => 'nullable|string|max:60',
            'intro'           => 'nullable|string|max:4000',
            'glance'          => 'nullable|array',
            'contact'         => 'nullable|array',
            'sections'        => 'sometimes|array',
            'is_published'    => 'nullable|boolean',
        ]);

        if ($request->has('sections')) {
            $this->assertSectionsRenderable($request->input('sections', []));
        }

        $document->update($data);

        AuditLog::record('legal_updated', 'legal_document', $document->id, $document->title,
            array_keys($data));

        return response()->json(['data' => $document->fresh()]);
    }

    /**
     * Reject anything LegalPage.jsx would silently skip.
     *
     * Its Block() switch returns null for an unknown type, so a typo would drop
     * a clause out of a live policy with no error anywhere.
     */
    private function assertSectionsRenderable(array $sections): void
    {
        foreach ($sections as $i => $section) {
            $where = 'section ' . ($i + 1) . ' (' . ($section['h'] ?? 'untitled') . ')';

            if (!is_array($section) || !filled($section['h'] ?? null)) {
                abort(422, "Every section needs a heading — check {$where}.");
            }
            if (!filled($section['id'] ?? null)) {
                abort(422, "Every section needs an anchor id — check {$where}. It is the #link used by the Contents list.");
            }

            $this->assertBlocks($section['blocks'] ?? [], $where);

            foreach ($section['subs'] ?? [] as $j => $sub) {
                $subWhere = $where . ', subsection ' . ($j + 1);
                if (!filled($sub['h'] ?? null)) {
                    abort(422, "Every subsection needs a heading — check {$subWhere}.");
                }
                $this->assertBlocks($sub['blocks'] ?? [], $subWhere);
            }
        }
    }

    private function assertBlocks(array $blocks, string $where): void
    {
        foreach ($blocks as $k => $b) {
            $type = $b['type'] ?? null;
            $at   = "block " . ($k + 1) . " of {$where}";

            if (!in_array($type, self::BLOCK_TYPES, true)) {
                abort(422, "Unknown block type “{$type}” in {$at}. Allowed: " . implode(', ', self::BLOCK_TYPES) . '.');
            }

            $bad = match ($type) {
                'p', 'note'            => !filled($b['text'] ?? null) ? 'needs text' : null,
                'list', 'olist'        => !is_array($b['items'] ?? null) || !count($b['items']) ? 'needs at least one item' : null,
                'defs'                 => !is_array($b['items'] ?? null) || !count($b['items']) ? 'needs at least one term' : null,
                'steps'                => !is_array($b['items'] ?? null) || !count($b['items']) ? 'needs at least one step' : null,
                'table'                => (!is_array($b['head'] ?? null) || !count($b['head'])) ? 'needs a header row' : null,
                default                => null,
            };

            if ($bad) abort(422, "The {$type} block in {$at} {$bad}.");

            // A table with a row that does not match its header renders ragged.
            if ($type === 'table') {
                foreach ($b['rows'] ?? [] as $r => $row) {
                    if (!is_array($row) || count($row) !== count($b['head'])) {
                        abort(422, "Row " . ($r + 1) . " of the table in {$at} has " . (is_array($row) ? count($row) : 0)
                            . " cells but the header has " . count($b['head']) . ".");
                    }
                }
            }
        }
    }
}
