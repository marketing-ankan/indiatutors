<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class AppNotification extends Model {
    protected $fillable = ['user_id','type','title','body','read_at'];
    protected $casts = ['read_at' => 'datetime'];

    public function user() { return $this->belongsTo(User::class); }

    /** One-liner used by controllers to raise an in-app notification. */
    public static function send(?int $userId, string $type, string $title, ?string $body = null): void {
        if ($userId) {
            static::create(['user_id' => $userId, 'type' => $type, 'title' => $title, 'body' => $body]);
        }
    }
}
