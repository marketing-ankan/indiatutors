<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Guest checkout orders (WooCommerce-parity cart/checkout flow). Payment is
// recorded as pending until a real Razorpay integration lands (Phase 7).
return new class extends Migration {
    public function up(): void {
        Schema::create('orders', function (Blueprint $t) {
            $t->id();
            $t->string('first_name', 100);
            $t->string('last_name', 100)->nullable();
            $t->string('email', 180);
            $t->string('phone', 20)->nullable();
            $t->string('country', 80)->default('India');
            $t->string('address_1', 200);
            $t->string('address_2', 200)->nullable();
            $t->string('city', 100);
            $t->string('state', 100)->nullable();
            $t->string('postcode', 12)->nullable();
            $t->decimal('total', 10, 2)->default(0);
            $t->string('currency', 3)->default('INR');
            $t->string('status', 20)->default('pending');          // pending -> paid/cancelled
            $t->string('payment_method', 40)->default('razorpay'); // stub until Phase 7 keys
            $t->text('order_notes')->nullable();
            $t->timestamps();
        });

        Schema::create('order_items', function (Blueprint $t) {
            $t->id();
            $t->foreignId('order_id')->constrained()->cascadeOnDelete();
            $t->foreignId('course_id')->nullable()->constrained()->nullOnDelete();
            $t->string('name');
            $t->decimal('price', 10, 2)->default(0);
            $t->unsignedSmallInteger('qty')->default(1);
            $t->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
    }
};
