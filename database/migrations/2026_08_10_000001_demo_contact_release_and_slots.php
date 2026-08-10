<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
| Stage 4 / C1 + C1a + C2 — coordinating a demo without handing a family's
| phone number to a stranger.
|
| TWO OWNER DECISIONS, 2026-08-10.
|
| 1. CONTACT REVEAL (C1a): "nothing until a coordinator releases it". A teacher
|    sees the enquiry — subject, grade, area, preferred times — but never the
|    phone, email or street address until a human presses Release. Hence a
|    timestamp plus WHO released it, rather than a boolean: when the question
|    is "who gave this teacher our number, and when", a flag cannot answer it.
|
|    This is the same instinct that already key-gates the matching export and
|    strips PII from TeacherDemoResource. Most of these students are minors and
|    the physical side carries home addresses; a reveal that happens as a side
|    effect of a status change is a reveal nobody decided to make.
|
| 2. SCHEDULING (C1/C2): "in-app by default, phone as fallback". So slots are
|    real rows, not prose in a notes field — a teacher proposes two or three,
|    the family accepts one, and a coordinator can settle it by phone and log
|    what was agreed. `source` records which of the two happened, because "the
|    parent chose this" and "staff were told this on a call" are different
|    facts and only one of them is the family's own word.
|
| No unique index on (demo_request_id, starts_at): a slot legitimately recurs
| after a decline — proposed Tuesday 4pm, declined, re-proposed the next week
| at the same clock time. Uniqueness lives on the ACCEPTED one instead, enforced
| in the controller inside a transaction, since partial indexes are not portable
| between sqlite (tests) and MySQL (production).
*/
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('demo_requests')) {
            Schema::table('demo_requests', function (Blueprint $t) {
                if (! Schema::hasColumn('demo_requests', 'contact_released_at')) {
                    $t->timestamp('contact_released_at')->nullable();
                }
                if (! Schema::hasColumn('demo_requests', 'contact_released_by')) {
                    $t->foreignId('contact_released_by')->nullable()->constrained('users')->nullOnDelete();
                }
            });
        }

        if (! Schema::hasTable('demo_slot_proposals')) {
            Schema::create('demo_slot_proposals', function (Blueprint $t) {
                $t->id();
                // cascade: a slot has no meaning without its demo.
                $t->foreignId('demo_request_id')->constrained()->cascadeOnDelete();
                $t->foreignId('proposed_by')->nullable()->constrained('users')->nullOnDelete();
                $t->string('source', 20)->default('teacher');   // teacher | coordinator
                $t->timestamp('starts_at');
                $t->unsignedSmallInteger('duration_minutes')->default(45);
                $t->string('note', 300)->nullable();
                $t->string('status', 20)->default('proposed');  // proposed | accepted | declined | withdrawn
                $t->timestamp('responded_at')->nullable();
                $t->timestamps();

                $t->index(['demo_request_id', 'status']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('demo_slot_proposals');

        if (Schema::hasTable('demo_requests')) {
            if (Schema::hasColumn('demo_requests', 'contact_released_by')) {
                Schema::table('demo_requests', function (Blueprint $t) {
                    $t->dropForeign(['contact_released_by']);
                    $t->dropColumn('contact_released_by');
                });
            }
            if (Schema::hasColumn('demo_requests', 'contact_released_at')) {
                Schema::table('demo_requests', fn (Blueprint $t) => $t->dropColumn('contact_released_at'));
            }
        }
    }
};
