<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
| The LMS's lead number, stamped on each pushed enquiry.
|
| This is the idempotency the intake API does not provide: the LMS stores our
| external_ref but never checks it, and its own duplicate guard only engages
| when a subject name resolves — so re-pushing a row must be OUR problem to
| prevent. A row with lms_lead_no set is never pushed again.
|
| hasColumn/hasTable guards throughout: this host's deploy DB step can be
| killed and retried across cycles, and the push code already tolerates the
| column not existing yet (Schema::hasColumn check before stamping).
*/
return new class extends Migration
{
    private const TABLES = ['tuition_requirements', 'demo_requests', 'support_tickets'];

    public function up(): void
    {
        foreach (self::TABLES as $table) {
            if (Schema::hasTable($table) && ! Schema::hasColumn($table, 'lms_lead_no')) {
                Schema::table($table, function (Blueprint $t) {
                    $t->string('lms_lead_no', 40)->nullable();
                });
            }
        }
    }

    public function down(): void
    {
        foreach (self::TABLES as $table) {
            if (Schema::hasTable($table) && Schema::hasColumn($table, 'lms_lead_no')) {
                Schema::table($table, function (Blueprint $t) {
                    $t->dropColumn('lms_lead_no');
                });
            }
        }
    }
};
