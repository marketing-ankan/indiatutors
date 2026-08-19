<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class AppNotification extends Model {
    protected $fillable = ['user_id','type','title','body','read_at'];
    protected $casts = ['read_at' => 'datetime'];

    public function user() { return $this->belongsTo(User::class); }

    /**
     * One-liner used by controllers to raise an in-app notification.
     *
     * Intentionally NOT filtered through ContactPolicy. This writes to the
     * person's own dashboard rather than sending them anything, so it is their
     * record of their own classes — suppressing it because they declined
     * WhatsApp would mean a family could not see that their teacher had
     * proposed a time. Outbound channels (email, WhatsApp) must ask
     * ContactPolicy first; this one is the record, not the message.
     */
    public static function send(?int $userId, string $type, string $title, ?string $body = null): void {
        if ($userId) {
            static::create(['user_id' => $userId, 'type' => $type, 'title' => $title, 'body' => $body]);
        }
    }
}
