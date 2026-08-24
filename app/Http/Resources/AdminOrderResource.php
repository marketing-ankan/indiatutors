<?php
namespace App\Http\Resources;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminOrderResource extends JsonResource {
    public function toArray(Request $request): array {
        return [
            'id'            => $this->id,
            // Staff quote this on the phone and search by it, so it has to
            // be here as well as on the customer's copy.
            'order_number'  => $this->order_number,
            'invoice_number'=> $this->invoice_number,
            'invoice_url'   => route('orders.invoice', ['order' => $this->id]),
            'customer'      => trim($this->first_name . ' ' . ($this->last_name ?? '')),
            'email'         => $this->email,
            'phone'         => $this->phone,
            'address'       => implode(', ', array_filter([$this->address_1, $this->address_2, $this->city, $this->state, $this->postcode, $this->country])),
            'total'         => (float) $this->total,
            'currency'      => $this->currency,
            'status'        => $this->status,
            'payment_method'=> $this->payment_method,
            'razorpay_payment_id' => $this->razorpay_payment_id,
            'order_notes'   => $this->order_notes,
            // Null for a guest checkout, which is the common case — the console
            // shows the typed-in name instead of pretending there is an account.
            'user'          => $this->whenLoaded('user', fn () => $this->user?->only(['id', 'name', 'email'])),
            'items'         => $this->whenLoaded('items', fn () => $this->items->map(fn ($i) => [
                'id' => $i->id, 'sku' => $i->sku, 'name' => $i->name, 'price' => (float) $i->price, 'qty' => $i->qty,
            ])),
            'created_at'    => optional($this->created_at)->toDateTimeString(),
        ];
    }
}
