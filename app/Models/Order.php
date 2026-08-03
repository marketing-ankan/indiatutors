<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model {
    protected $guarded = [];
    protected $casts = ['total' => 'float'];

    public function items(): HasMany { return $this->hasMany(OrderItem::class); }
    // Nullable: checkout is open to guests, so an order need not have an account.
    public function user() { return $this->belongsTo(User::class); }
}
