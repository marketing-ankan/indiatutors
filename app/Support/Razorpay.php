<?php
namespace App\Support;

use Illuminate\Support\Facades\Http;

/**
 * Minimal Razorpay Orders-API client (kept SDK-free so the committed vendor/
 * tree stays untouched). Enabled only when both keys are configured; callers
 * fall back to the pending-payment stub flow otherwise.
 */
class Razorpay {
    public static function enabled(): bool {
        return (bool) (config('services.razorpay.key') && config('services.razorpay.secret'));
    }

    public static function key(): ?string {
        return config('services.razorpay.key');
    }

    /**
     * Create a Razorpay order for the given amount (in paise).
     * Returns the decoded API response, or null on any failure — checkout
     * must never break because the payment gateway is down.
     */
    public static function createOrder(int $amountPaise, string $receipt): ?array {
        try {
            $resp = Http::withBasicAuth(config('services.razorpay.key'), config('services.razorpay.secret'))
                ->timeout(10)
                ->post('https://api.razorpay.com/v1/orders', [
                    'amount'   => $amountPaise,
                    'currency' => 'INR',
                    'receipt'  => $receipt,
                ]);
            return $resp->successful() ? $resp->json() : null;
        } catch (\Throwable) {
            return null;
        }
    }

    /** Checkout callback signature: HMAC-SHA256("order_id|payment_id", secret). */
    public static function verifySignature(string $orderId, string $paymentId, string $signature): bool {
        $expected = hash_hmac('sha256', $orderId.'|'.$paymentId, (string) config('services.razorpay.secret'));
        return hash_equals($expected, $signature);
    }
}
