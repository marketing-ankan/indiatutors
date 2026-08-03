<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class AuditLog extends Model {
    protected $fillable = [
        'actor_id','actor_label','action','object_type','object_id','object_label','details','ip_address',
    ];
    protected $casts = ['details' => 'array'];

    public function actor() { return $this->belongsTo(User::class, 'actor_id'); }

    /**
     * One-liner used by controllers to record a staff action, mirroring
     * AppNotification::send. The actor is read from the current request so
     * callers never pass it; writes with no authenticated user (a public
     * signup) log as "system", which is what the console shows.
     */
    public static function record(
        string $action,
        ?string $objectType = null,
        ?int $objectId = null,
        ?string $objectLabel = null,
        array $details = [],
    ): void {
        $actor = Auth::user();
        static::create([
            'actor_id'     => $actor?->id,
            'actor_label'  => $actor ? "{$actor->name} <{$actor->email}>" : 'system',
            'action'       => $action,
            'object_type'  => $objectType,
            'object_id'    => $objectId,
            'object_label' => $objectLabel ? mb_substr($objectLabel, 0, 190) : null,
            'details'      => $details ?: null,
            'ip_address'   => request()?->ip(),
        ]);
    }
}
