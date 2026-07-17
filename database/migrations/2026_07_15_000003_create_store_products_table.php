<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// Physical Instruments & Robotics-Kits store (WinQuest-adopted, catalog +
// enquiry — no online payment/shipping). Categories + products are seeded
// from database/seeders/data/store.json by StoreProductSeeder (idempotent,
// runs in the cron deploy); this migration only defines the table.
return new class extends Migration {
    public function up(): void {
        Schema::create('store_products', function (Blueprint $t) {
            $t->id();
            $t->string('name', 190);
            $t->string('slug', 200)->unique();
            $t->string('category', 60)->index();
            $t->unsignedInteger('price')->default(0); // indicative INR
            $t->text('blurb')->nullable();
            $t->string('image_url', 500)->nullable();
            $t->unsignedInteger('position')->default(0);
            $t->boolean('is_published')->default(true);
            $t->timestamps();
        });

        // Seed the catalog from the committed data file so the cron deploy's
        // migrate --force populates staging on the same run that ships the code.
        $path = base_path('database/seeders/data/store.json');
        if (is_file($path)) {
            $data = json_decode(file_get_contents($path), true);
            $now = now();
            $rows = array_map(fn ($p) => [
                'name'         => $p['name'],
                'slug'         => $p['slug'],
                'category'     => $p['category'],
                'price'        => $p['price'] ?? 0,
                'blurb'        => $p['blurb'] ?? null,
                'position'     => $p['position'] ?? 0,
                'is_published' => true,
                'created_at'   => $now,
                'updated_at'   => $now,
            ], $data['products'] ?? []);
            foreach (array_chunk($rows, 50) as $chunk) DB::table('store_products')->insert($chunk);
        }
    }
    public function down(): void { Schema::dropIfExists('store_products'); }
};
