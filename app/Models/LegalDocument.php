<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * One policy page — Terms, Payment & Refund, Refer & Earn, Privacy.
 *
 * `sections` holds the document body in the exact shape LegalPage.jsx renders:
 * [{ id, h, blocks: [...], subs: [{ h, blocks: [...] }] }]. Section numbers are
 * produced by the renderer from array order, so headings never carry a number
 * and reordering renumbers the document.
 */
class LegalDocument extends Model
{
    protected $fillable = [
        'slug', 'key', 'title', 'eyebrow', 'updated_label', 'effective_label',
        'intro', 'glance', 'sections', 'contact', 'is_published', 'position',
    ];

    protected $casts = [
        'glance'       => 'array',
        'sections'     => 'array',
        'contact'      => 'array',
        'is_published' => 'boolean',
    ];

    public function scopePublished($q) { return $q->where('is_published', true); }
}
