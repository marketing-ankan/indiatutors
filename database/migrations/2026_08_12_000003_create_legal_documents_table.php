<?php

use App\Support\LegalDocumentImporter;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Moves the four policy documents out of the frontend bundle and into the
 * database, so an admin can correct a refund window without a developer.
 *
 * They lived in resources/js/data/legal.js — 158KB of Terms, Payment & Refund,
 * Refer & Earn and Privacy compiled into the JS bundle. Editing a single clause
 * meant a code change, a build and a deploy.
 *
 * The stored shape is EXACTLY the shape LegalPage.jsx already renders — sections
 * with numbered headings, subsections, and seven block types (p, list, olist,
 * defs, table, steps, note). Nothing about the rendering changes; only where the
 * data comes from. That matters because these are legal documents on a live
 * site: a re-typing or a format conversion is a chance to alter their meaning.
 *
 * `__ENTITY__` placeholders are preserved rather than baked in. The registered
 * name appears in 14 places across the four documents, and the E-Commerce Rules
 * require it to be correct, so it stays a single substitution driven by the
 * `entity_name` site setting.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('legal_documents')) {
            Schema::create('legal_documents', function (Blueprint $table) {
                $table->id();
                // The route key, e.g. "privacy-policy". LegalPage is mounted on
                // several aliases (/privacy and /privacy-policy both resolve).
                $table->string('slug', 80)->unique();
                // The stable identifier the frontend fallback keys on, so a
                // renamed slug cannot orphan a page: terms|refund|referEarn|privacy.
                $table->string('key', 40)->unique();
                $table->string('title', 190);
                $table->string('eyebrow', 60)->nullable();
                $table->string('updated_label', 60)->nullable();   // free text: "3 August 2026"
                $table->string('effective_label', 60)->nullable();
                $table->text('intro')->nullable();
                $table->json('glance')->nullable();                // [{icon,t,d}]
                $table->json('sections');                          // the document body
                $table->json('contact')->nullable();               // [{icon,label,value,href}]
                $table->boolean('is_published')->default(true);
                $table->unsignedInteger('position')->default(0);
                $table->timestamps();
            });
        }

        LegalDocumentImporter::import();
    }

    public function down(): void
    {
        Schema::dropIfExists('legal_documents');
    }
};
