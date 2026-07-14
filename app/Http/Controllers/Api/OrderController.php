<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Order;
use App\Support\Razorpay;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller {
    /**
     * Guest checkout (WooCommerce parity). Items are re-priced from the
     * catalog server-side — the client only sends slugs — and the order is
     * recorded as pending. When Razorpay keys are configured a gateway order
     * is created too and the response carries the modal payload; the client
     * then confirms via verify() below.
     */
    public function store(Request $request) {
        $data = $request->validate([
            'first_name'   => 'required|string|max:100',
            'last_name'    => 'nullable|string|max:100',
            'email'        => 'required|email|max:180',
            'phone'        => 'nullable|string|max:20',
            'country'      => 'nullable|string|max:80',
            'address_1'    => 'required|string|max:200',
            'address_2'    => 'nullable|string|max:200',
            'city'         => 'required|string|max:100',
            'state'        => 'nullable|string|max:100',
            'postcode'     => 'nullable|string|max:12',
            'order_notes'  => 'nullable|string|max:2000',
            'items'        => 'required|array|min:1|max:50',
            'items.*.slug' => 'required|string|max:190',
        ]);

        $slugs   = collect($data['items'])->pluck('slug')->unique()->values();
        $courses = Course::whereIn('slug', $slugs)->published()->get();
        if ($courses->isEmpty()) {
            return response()->json(['message' => 'None of the cart items are available.'], 422);
        }

        $order = DB::transaction(function () use ($data, $courses) {
            $order = Order::create([
                'first_name'  => $data['first_name'],
                'last_name'   => $data['last_name'] ?? null,
                'email'       => $data['email'],
                'phone'       => $data['phone'] ?? null,
                'country'     => $data['country'] ?? 'India',
                'address_1'   => $data['address_1'],
                'address_2'   => $data['address_2'] ?? null,
                'city'        => $data['city'],
                'state'       => $data['state'] ?? null,
                'postcode'    => $data['postcode'] ?? null,
                'order_notes' => $data['order_notes'] ?? null,
                'status'      => 'pending',
            ]);
            $total = 0;
            foreach ($courses as $c) {
                $price = (float) $c->effective_price;
                $order->items()->create([
                    'course_id' => $c->id,
                    'name'      => $c->name,
                    'price'     => $price,
                    'qty'       => 1, // catalog products are sold individually (live parity)
                ]);
                $total += $price;
            }
            $order->update(['total' => $total]);
            return $order;
        });

        // Gateway order (only when keys are configured; never blocks checkout).
        $razorpay = null;
        if (Razorpay::enabled()) {
            $rp = Razorpay::createOrder((int) round($order->total * 100), 'order_'.$order->id);
            if ($rp && !empty($rp['id'])) {
                $order->update(['razorpay_order_id' => $rp['id']]);
                $razorpay = [
                    'key'      => Razorpay::key(),
                    'order_id' => $rp['id'],
                    'amount'   => $rp['amount'],
                    'currency' => $rp['currency'] ?? 'INR',
                    'name'     => 'Indiatutors Online',
                    'prefill'  => [
                        'name'    => trim($order->first_name.' '.($order->last_name ?? '')),
                        'email'   => $order->email,
                        'contact' => $order->phone,
                    ],
                ];
            }
        }

        return response()->json([
            'message'  => 'Order received.',
            'order'    => self::orderPayload($order),
            'razorpay' => $razorpay,
        ], 201);
    }

    /** Confirm a Razorpay checkout callback and mark the order paid. */
    public function verify(Request $request) {
        $data = $request->validate([
            'razorpay_order_id'   => 'required|string|max:60',
            'razorpay_payment_id' => 'required|string|max:60',
            'razorpay_signature'  => 'required|string|max:200',
        ]);

        $order = Order::where('razorpay_order_id', $data['razorpay_order_id'])->first();
        if (!$order) return response()->json(['message' => 'Order not found.'], 404);

        if (!Razorpay::enabled() || !Razorpay::verifySignature($data['razorpay_order_id'], $data['razorpay_payment_id'], $data['razorpay_signature'])) {
            return response()->json(['message' => 'Payment signature could not be verified.'], 422);
        }

        $order->update(['status' => 'paid', 'razorpay_payment_id' => $data['razorpay_payment_id']]);

        return response()->json(['message' => 'Payment verified.', 'order' => self::orderPayload($order->fresh('items'))]);
    }

    private static function orderPayload(Order $order): array {
        return [
            'number'         => $order->id,
            'date'           => $order->created_at->toDateString(),
            'email'          => $order->email,
            'total'          => $order->total,
            'currency'       => $order->currency,
            'payment_method' => $order->payment_method,
            'status'         => $order->status,
            'items'          => $order->items->map(fn ($i) => ['name' => $i->name, 'price' => $i->price, 'qty' => $i->qty]),
        ];
    }
}
