<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('orders', function (Blueprint $t) {
            $t->string('razorpay_order_id', 60)->nullable()->index()->after('payment_method');
            $t->string('razorpay_payment_id', 60)->nullable()->after('razorpay_order_id');
        });
    }
    public function down(): void {
        Schema::table('orders', function (Blueprint $t) {
            $t->dropColumn(['razorpay_order_id', 'razorpay_payment_id']);
        });
    }
};
