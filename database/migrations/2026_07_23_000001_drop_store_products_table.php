<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

// The Instruments & Robotics-Kits store was removed from the India site
// (user decision, Jul 2026) — frontend pages, API and model are gone, so
// drop its table. dropIfExists keeps this idempotent: it cleans up servers
// where the (now-deleted) create migration already ran, and no-ops on fresh
// databases that never had the table.
return new class extends Migration {
    public function up(): void {
        Schema::dropIfExists('store_products');
    }
    public function down(): void {
        // Intentionally empty — the store feature no longer exists to restore.
    }
};
