<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Http\Resources\AdminOrderResource;
use App\Models\Course;
use App\Models\Order;
use App\Models\VideoCourse;
use App\Models\VideoEntitlement;
use App\Support\RateCard;
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
            'items.*.kind' => 'nullable|in:course,video',
            // The plan and level the buyer chose on the product page. The
            // AMOUNT is never accepted from the browser — only the choice.
            'items.*.plan'  => 'nullable|string|max:20',
            'items.*.level' => 'nullable|string|max:20',
        ]);

        // Split cart items by kind and re-price each from its own table.
        $bySlug  = collect($data['items'])->keyBy('slug');
        $videoSlugs  = $bySlug->filter(fn ($i) => ($i['kind'] ?? 'course') === 'video')->keys();
        $courseSlugs = $bySlug->filter(fn ($i) => ($i['kind'] ?? 'course') !== 'video')->keys();

        $courses = Course::whereIn('slug', $courseSlugs)->published()->get();
        $videos  = VideoCourse::whereIn('slug', $videoSlugs)->published()->get();
        if ($courses->isEmpty() && $videos->isEmpty()) {
            return response()->json(['message' => 'None of the cart items are available.'], 422);
        }

        // Public route: capture the buyer from a bearer token if one is present,
        // so video-course entitlements can attach to their account on payment.
        $userId = $request->user('sanctum')?->id;
        $order = DB::transaction(function () use ($data, $courses, $videos, $userId, $bySlug) {
            $order = Order::create([
                'user_id'     => $userId,
                'first_name'  => $data['first_name'],
                'last_name'   => $data['last_name'] ?? null,
                'email'       => $data['email'],
                'phone'       => $data['phone'] ?? null,
                // Pinned, not defaulted. The checkout form no longer offers a
                // choice, but this route is public, so a direct POST could still
                // record a foreign billing country and recreate the conflict with
                // the policies. Overwritten rather than rejected on purpose: the
                // PWA service worker can serve an older bundle that still sends a
                // country, and that buyer should complete checkout, not get a 422.
                'country'     => 'India',
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
                // Price the line the way the page quoted it: the owner's rate for
                // the plan and level the buyer chose. `effective_price` is the
                // catalogue "from" figure — the CHEAPEST rate, i.e. the group rate
                // wherever a course has one — so using it for a One-to-One
                // purchase billed half the advertised amount.
                //
                // The browser sends the CHOICE, never the amount.
                $line  = $bySlug[$c->slug] ?? [];
                $plan  = $line['plan']  ?? null;
                $level = $line['level'] ?? null;

                $rate = (RateCard::isValidPlan($plan) && RateCard::isValidLevel($level))
                    ? RateCard::price($c->name, $plan, $level)
                    : null;

                $price = (float) ($rate ?? $c->effective_price);
                // Name the line so the invoice says what was bought, not just
                // "Chess" at a number the customer cannot account for.
                $label = $rate !== null ? "{$c->name} — {$plan}, {$level}" : $c->name;

                $order->items()->create(['course_id' => $c->id, 'name' => $label, 'price' => $price, 'qty' => 1]);
                $total += $price;
            }
            foreach ($videos as $v) {
                $price = (float) $v->price;
                $order->items()->create(['video_course_id' => $v->id, 'name' => $v->title.' (video course)', 'price' => $price, 'qty' => 1]);
                $total += $price;
            }
            $order->update(['total' => $total]);
            // Free video courses (price 0) unlock immediately for a logged-in buyer.
            if ($order->total == 0) { $order->update(['status' => 'paid']); self::grantEntitlements($order); }
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

    /**
     * The signed-in buyer's own orders. Checkout is open to guests, so this
     * only ever returns the ones placed while signed in (orders.user_id) — a
     * guest order made with the same email deliberately does not appear, since
     * an unverified email match is not proof of ownership.
     */
    public function myIndex(Request $request) {
        return AdminOrderResource::collection(
            $request->user()->orders()->with('items')->latest()->get()
        );
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
        self::grantEntitlements($order);

        return response()->json(['message' => 'Payment verified.', 'order' => self::orderPayload($order->fresh('items'))]);
    }

    /**
     * Grant video-course access for every video item on a paid order. Idempotent
     * (unique user+course), so it's safe to call on any →paid transition. Needs
     * the order to belong to a user; guest video orders can't be entitled.
     */
    public static function grantEntitlements(Order $order): void {
        if ($order->status !== 'paid' || !$order->user_id) return;
        foreach ($order->items()->whereNotNull('video_course_id')->get() as $item) {
            VideoEntitlement::firstOrCreate(
                ['user_id' => $order->user_id, 'video_course_id' => $item->video_course_id],
                ['order_id' => $order->id, 'granted_at' => now()],
            );
        }
    }

    private static function orderPayload(Order $order): array {
        return [
            // The order's own number, not its primary key. "#123" told every
            // customer how many orders the business had ever taken, and could
            // not survive anything that renumbered rows.
            'number'         => $order->order_number ?: ('#' . $order->id),
            'invoice_number' => $order->invoice_number,
            // Signed, and time-limited, because checkout is open to guests:
            // they have no account to authenticate with, so the URL itself has
            // to be the credential. Thirty days is long enough to keep a
            // receipt and short enough that a forwarded link stops working.
            // Staff can always re-issue from the console.
            'invoice_url'    => \Illuminate\Support\Facades\URL::temporarySignedRoute(
                'orders.invoice', now()->addDays(30), ['order' => $order->id],
            ),
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
