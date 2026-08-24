<?php
use App\Support\Sku;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * A product code for everything that can be sold, and a copy of it on the line
 * that sold it.
 *
 * `courses.sku` already existed, nullable and unique, and five of 110 rows used
 * it. Video courses had no such column at all, and an order line recorded only
 * a name — so once a course was renamed, the order that sold it no longer
 * agreed with the catalogue about what had been bought.
 *
 * The copy on order_items is deliberate DENORMALISATION, and the only kind
 * worth defending: an order line is a historical record of a sale. It must keep
 * saying what was sold even after the product is renamed, re-coded or deleted,
 * and a foreign key cannot promise that.
 */
return new class extends Migration {
    public function up(): void
    {
        // Guarded per object, not per file. Each of these is a separate ALTER
        // that MySQL commits on the spot, and the backfill below runs for as
        // long as the catalogue is long — so a killed deploy leaves some of this
        // committed with no migrations row, and an unguarded retry would fail on
        // "duplicate column sku" for ever, blocking everything behind it.
        if (! Schema::hasColumn('video_courses', 'sku')) {
            Schema::table('video_courses', function (Blueprint $t) {
                $t->string('sku', 120)->nullable()->after('id');
            });
        }

        // Its own statement, after the column, so it needs its own guard: a
        // column present without its index is a real state to land in.
        if (! Schema::hasIndex('video_courses', ['sku'], 'unique')) {
            Schema::table('video_courses', fn (Blueprint $t) => $t->unique('sku'));
        }

        if (! Schema::hasColumn('order_items', 'sku')) {
            Schema::table('order_items', function (Blueprint $t) {
                // Not unique and not a foreign key: many lines may sell the same
                // product, and the line has to outlive the product.
                $t->string('sku', 120)->nullable()->after('video_course_id');
            });
        }

        $this->backfill();
    }

    /**
     * Codes for everything that has none, oldest first so the numbers run in
     * the order the catalogue was built. Idempotent: anything already carrying
     * a code — including the five typed by hand — keeps it untouched.
     */
    private function backfill(): void
    {
        foreach ([['courses', Sku::COURSE], ['video_courses', Sku::VIDEO]] as [$table, $type]) {
            $rows = DB::table($table)
                ->where(fn ($q) => $q->whereNull('sku')->orWhere('sku', ''))
                ->orderBy('id')
                ->pluck('id');

            foreach ($rows as $id) {
                DB::table($table)->where('id', $id)->update(['sku' => Sku::next($type)]);
            }
        }

        // Existing order lines get the code their product carries now. Lines
        // whose product has since been deleted stay null — inventing one would
        // be asserting something about a sale nobody can check.
        DB::table('order_items')->whereNull('sku')->orderBy('id')->chunkById(200, function ($items) {
            foreach ($items as $item) {
                $sku = $item->course_id
                    ? DB::table('courses')->where('id', $item->course_id)->value('sku')
                    : ($item->video_course_id
                        ? DB::table('video_courses')->where('id', $item->video_course_id)->value('sku')
                        : null);

                if ($sku) DB::table('order_items')->where('id', $item->id)->update(['sku' => $sku]);
            }
        });
    }

    public function down(): void
    {
        Schema::table('video_courses', fn (Blueprint $t) => $t->dropColumn('sku'));
        Schema::table('order_items', fn (Blueprint $t) => $t->dropColumn('sku'));
    }
};
