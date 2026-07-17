<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\StoreProduct;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class StoreProductController extends Controller {
    /** Public catalog, ordered by category then position. */
    public function index() {
        return response()->json(['data' => StoreProduct::published()->orderBy('category')->orderBy('position')->orderBy('name')->get()]);
    }

    public function show(string $slug) {
        $p = StoreProduct::published()->where('slug', $slug)->firstOrFail();
        $related = StoreProduct::published()->where('category', $p->category)->where('id', '!=', $p->id)->orderBy('position')->limit(4)->get();
        return response()->json(['data' => $p, 'related' => $related]);
    }

    // ---- Staff Console CRUD ----
    public function adminIndex() {
        return response()->json(['data' => StoreProduct::orderBy('category')->orderBy('position')->get()]);
    }

    public function store(Request $request) {
        $data = $this->validated($request);
        $data['slug'] = $this->uniqueSlug($data['name']);
        return response()->json(StoreProduct::create($data), 201);
    }

    public function update(Request $request, StoreProduct $storeProduct) {
        $storeProduct->update($this->validated($request, partial: true));
        return response()->json($storeProduct->fresh());
    }

    public function destroy(StoreProduct $storeProduct) {
        $storeProduct->delete();
        return response()->json(['message' => 'Product deleted.']);
    }

    private function validated(Request $request, bool $partial = false): array {
        return $request->validate([
            'name'         => ($partial ? 'sometimes|' : '').'required|string|max:190',
            'category'     => ($partial ? 'sometimes|' : '').'required|string|max:60',
            'price'        => 'nullable|integer|min:0',
            'blurb'        => 'nullable|string|max:2000',
            'image_url'    => 'nullable|url|max:500',
            'position'     => 'nullable|integer',
            'is_published' => 'nullable|boolean',
        ]);
    }

    private function uniqueSlug(string $name): string {
        $base = Str::slug($name) ?: 'product';
        $slug = $base; $i = 2;
        while (StoreProduct::where('slug', $slug)->exists()) $slug = $base.'-'.$i++;
        return $slug;
    }
}
