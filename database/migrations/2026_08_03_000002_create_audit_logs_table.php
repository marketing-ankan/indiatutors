<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Staff audit trail. Role changes, account creation and application decisions
// left no record of *who* made them — the row shows the new value and nothing
// else. With more than one admin that is unanswerable after the fact.
return new class extends Migration {
    public function up(): void {
        if (Schema::hasTable('audit_logs')) return;   // idempotent (deploy-safe)
        Schema::create('audit_logs', function (Blueprint $t) {
            $t->id();
            $t->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            // Denormalised on purpose: the log must still name the actor after
            // their account is deleted. An audit trail that forgets who acted
            // is not an audit trail. Same reasoning for object_label below —
            // and object_id deliberately has NO foreign key, so a row survives
            // the hard delete it is recording.
            $t->string('actor_label', 190)->nullable();
            $t->string('action', 60);                    // user_added | role_changed | teacher_status | order_status | …
            $t->string('object_type', 40)->nullable();   // user | teacher_application | order | review | booking | course
            $t->unsignedBigInteger('object_id')->nullable();
            $t->string('object_label', 190)->nullable();
            $t->json('details')->nullable();             // {"from":"parent","to":"teacher"}
            $t->string('ip_address', 45)->nullable();    // 45 = INET6_ADDRSTRLEN
            $t->timestamps();
            $t->index(['object_type', 'object_id']);
            $t->index(['action', 'created_at']);
        });
    }
    public function down(): void { Schema::dropIfExists('audit_logs'); }
};
