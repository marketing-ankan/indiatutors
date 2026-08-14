<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * The Content tab could not create a post unless the optional Author field
     * was filled in. The column was NOT NULL with a default — but a default
     * only applies when the column is OMITTED from the insert, and the console
     * form sends an explicit null for a blank author, so the write died on the
     * constraint. Everything above the schema already treats author as
     * optional: the API validates it `nullable` and the public pages hide the
     * byline when it is absent.
     *
     * change() in Laravel 11 keeps only the modifiers restated here, so this
     * also drops the 'IndiaTutors Team' default — a post with no author now
     * simply has no byline, which is what the form promises. Idempotent by
     * nature (altering to the same definition), so a killed-and-retried deploy
     * passes through safely; single-statement, so MySQL's non-transactional
     * DDL cannot half-apply it.
     */
    public function up(): void {
        Schema::table('posts', function (Blueprint $t) {
            $t->string('author', 120)->nullable()->change();
        });
    }

    public function down(): void {
        Schema::table('posts', function (Blueprint $t) {
            $t->string('author', 120)->default('IndiaTutors Team')->change();
        });
    }
};
