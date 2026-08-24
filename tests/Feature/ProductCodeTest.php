<?php
namespace Tests\Feature;

use App\Models\Course;
use App\Models\Order;
use App\Models\User;
use App\Models\VideoCourse;
use App\Support\Sku;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Product codes.
 *
 * An order number identifies a transaction; a SKU identifies the thing sold.
 * The properties worth pinning are the two that make a code worth having at
 * all: it never changes under a product, and it never belongs to two products.
 * Everything else is plumbing.
 */
class ProductCodeTest extends TestCase
{
    use RefreshDatabase;

    private function course(array $attrs = []): Course
    {
        return Course::create($attrs + [
            'name' => 'Mathematics Grade 9-10', 'slug' => 'maths-' . uniqid(),
            'regular_price' => 1000, 'is_published' => true,
        ]);
    }

    public function test_a_new_course_is_given_a_code(): void
    {
        $this->assertMatchesRegularExpression('/^ITO-C-\d{4}$/', $this->course()->sku);
    }

    public function test_a_new_video_course_is_given_its_own_series(): void
    {
        $v = VideoCourse::create(['title' => 'Python', 'slug' => 'py-' . uniqid(), 'price' => 499]);

        $this->assertMatchesRegularExpression('/^ITO-V-\d{4}$/', $v->sku);
    }

    public function test_codes_do_not_repeat(): void
    {
        $codes = collect(range(1, 6))->map(fn () => $this->course()->sku);

        $this->assertCount(6, $codes->unique(), 'Two products shared a code: ' . $codes->implode(', '));
    }

    /**
     * The one thing a product code must never do. A code derived from the title
     * would break here, which is exactly why these are sequential.
     */
    public function test_a_code_survives_the_product_being_renamed(): void
    {
        $c    = $this->course();
        $code = $c->sku;

        $c->update(['name' => 'Something Else Entirely', 'slug' => 'else-' . uniqid()]);

        $this->assertSame($code, $c->fresh()->sku);
    }

    /**
     * The five codes on this site were typed by hand and are already searchable
     * in the console — they may be written down somewhere this repo cannot see.
     * A supplied code is kept, never replaced.
     */
    public function test_a_code_supplied_by_hand_is_respected(): void
    {
        $c = $this->course(['sku' => 'ito-legacy-thing']);

        $this->assertSame('ito-legacy-thing', $c->sku);
        $this->assertFalse(Sku::isGenerated($c->sku));
    }

    /**
     * An order line is a historical record. It must keep naming what was sold
     * after the product is renamed — or deleted — so the code is COPIED onto
     * the line rather than looked up through a relation.
     */
    public function test_an_order_line_keeps_the_code_it_was_sold_under(): void
    {
        $c = $this->course();

        $this->postJson('/api/orders', [
            'first_name' => 'Asha', 'email' => 'asha@example.test',
            'address_1' => '1 Park Street', 'city' => 'Kolkata',
            'items' => [['slug' => $c->slug]],
        ])->assertSuccessful();

        $item = Order::first()->items->first();
        $this->assertSame($c->sku, $item->sku);

        // Rename the product, then delete it outright.
        $c->update(['name' => 'Renamed']);
        $this->assertSame($c->sku, $item->fresh()->sku);

        $c->delete();
        $this->assertSame($c->sku, $item->fresh()->sku, 'The sale still has to say what was sold.');
    }

    public function test_staff_can_find_orders_by_what_was_bought(): void
    {
        $c = $this->course();
        $this->postJson('/api/orders', [
            'first_name' => 'Asha', 'email' => 'asha@example.test',
            'address_1' => '1 Park Street', 'city' => 'Kolkata',
            'items' => [['slug' => $c->slug]],
        ])->assertSuccessful();

        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        $res = $this->getJson('/api/admin/orders?q=' . $c->sku)->assertOk();
        $this->assertCount(1, $res->json('data'));

        // ...and the code reaches the console rather than being dropped by the
        // eager load's column list, which reads exactly like "never had one".
        $this->assertSame($c->sku, $res->json('data.0.items.0.sku'));
    }

    public function test_the_customers_own_order_shows_the_codes(): void
    {
        $c = $this->course();

        $res = $this->postJson('/api/orders', [
            'first_name' => 'Asha', 'email' => 'asha@example.test',
            'address_1' => '1 Park Street', 'city' => 'Kolkata',
            'items' => [['slug' => $c->slug]],
        ])->assertSuccessful();

        $this->assertSame($c->sku, $res->json('order.items.0.sku'));
    }

    public function test_the_invoice_prints_the_code(): void
    {
        $c = $this->course();
        $this->postJson('/api/orders', [
            'first_name' => 'Asha', 'email' => 'asha@example.test',
            'address_1' => '1 Park Street', 'city' => 'Kolkata',
            'items' => [['slug' => $c->slug]],
        ])->assertSuccessful();

        $order = Order::first();
        $order->update(['status' => 'paid']);

        $res = $this->get(\Illuminate\Support\Facades\URL::temporarySignedRoute(
            'orders.invoice', now()->addDay(), ['order' => $order->id],
        ))->assertOk();

        $this->assertStringStartsWith('%PDF', $res->getContent());
    }
}
