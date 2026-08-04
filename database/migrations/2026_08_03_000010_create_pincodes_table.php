<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Reference geography for physical (home-tuition) matching.
//
// A teacher tells us "I'll travel 8 km from 700156". Nothing downstream can act
// on that until 700156 becomes a coordinate — a radius is a circle, and a circle
// needs a centre. This table is that lookup: one row per pincode, carrying the
// district/state (so address forms autofill instead of asking the teacher to
// type "North 24 Parganas" correctly) and a centroid.
//
// One row per PINCODE, not per post office: we need a centre to measure from,
// not a postal directory. The office names collapse into `localities`, which is
// what the address form offers as an "area" dropdown.
return new class extends Migration {
    public function up(): void {
        if (Schema::hasTable('pincodes')) return;   // idempotent — the cron deploy runs under set -e
        Schema::create('pincodes', function (Blueprint $t) {
            $t->string('pincode', 6)->primary();
            $t->string('district', 120)->nullable();
            $t->string('state', 120)->nullable();
            $t->json('localities')->nullable();          // ["Salt Lake City","Sector V"]
            $t->decimal('latitude', 10, 7)->nullable();
            $t->decimal('longitude', 10, 7)->nullable();
            // How the centroid was obtained, so a matcher can weight it:
            // seed (bundled) | import (official CSV) | api (India Post, no coords) | manual
            $t->string('source', 12)->default('seed');
            $t->timestamps();

            $t->index(['state', 'district']);
        });
    }

    public function down(): void { Schema::dropIfExists('pincodes'); }
};
