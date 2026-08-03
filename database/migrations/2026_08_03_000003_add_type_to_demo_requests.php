<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// The booking form has always offered five flows (free demo, group class,
// workshop, free class, physical tutor) but recorded which one only by
// prefixing the free-text message — "[Book a Free Workshop] …". That is not
// filterable, so the console could never answer "how many workshop bookings".
// Store the flow properly and backfill the old rows from that prefix.
return new class extends Migration {
    private const PREFIXES = [
        'workshop' => '[Book a Free Workshop]%',
        'group'    => '[Book a Free Group-Class Demo]%',
        'free'     => '[Book a Free Class]%',
        'physical' => '[Find a Physical Home Tutor]%',
    ];

    public function up(): void {
        if (!Schema::hasColumn('demo_requests', 'type')) {
            Schema::table('demo_requests', function (Blueprint $t) {
                $t->string('type', 20)->default('demo')->after('status');
            });
        }
        foreach (self::PREFIXES as $type => $like) {
            DB::table('demo_requests')->where('message', 'like', $like)->update(['type' => $type]);
        }
    }

    public function down(): void {
        Schema::table('demo_requests', function (Blueprint $t) { $t->dropColumn('type'); });
    }
};
