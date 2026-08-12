<?php
namespace App\Support;

use App\Models\LegalDocument;
use App\Models\Setting;
use Illuminate\Support\Facades\Schema;

/**
 * One-time import of the four policy documents from the JSON exported out of
 * the old resources/js/data/legal.js.
 *
 * Idempotent: returns immediately once any document exists, so re-running the
 * migration or the seeder never overwrites an edit the owner has made. The
 * database is authoritative from the first import onwards.
 *
 * Unlike the group-class import this does NOT depend on any other table, so it
 * is safe from both a migration and a seeder on a fresh install.
 */
class LegalDocumentImporter
{
    public static function import(): int
    {
        if (!Schema::hasTable('legal_documents') || LegalDocument::exists()) {
            return 0;
        }

        $path = base_path('database/data/legal-documents.json');
        if (!is_file($path)) {
            return 0;
        }

        $data = json_decode((string) file_get_contents($path), true);

        // The registered entity name, kept as one substitution rather than baked
        // into 14 places across the documents.
        if (!empty($data['entity']) && Schema::hasTable('settings') && !Setting::get('entity_name')) {
            Setting::put('entity_name', $data['entity']);
        }

        $n = 0;
        foreach ($data['documents'] ?? [] as $doc) {
            if (empty($doc['slug']) || empty($doc['key'])) continue;

            LegalDocument::create([
                'slug'            => $doc['slug'],
                'key'             => $doc['key'],
                'title'           => $doc['title'] ?? $doc['key'],
                'eyebrow'         => $doc['eyebrow'] ?? 'Legal',
                'updated_label'   => $doc['updated'] ?? null,
                'effective_label' => $doc['effective'] ?? null,
                'intro'           => $doc['intro'] ?? null,
                'glance'          => $doc['glance'] ?? [],
                'sections'        => $doc['sections'] ?? [],
                'contact'         => $doc['contact'] ?? [],
                'is_published'    => true,
                'position'        => $doc['position'] ?? $n,
            ]);
            $n++;
        }

        return $n;
    }
}
