<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SupportTicket extends Model
{
    public const SOURCES    = ['website', 'dashboard', 'contact_form'];
    public const CATEGORIES = ['classes', 'billing', 'technical', 'other'];
    public const STATUSES   = ['open', 'answered', 'closed'];

    protected $fillable = [
        'code', 'user_id', 'name', 'email', 'phone', 'subject',
        'source', 'category', 'enrollment_id', 'status', 'last_message_at',
    ];

    protected $casts = ['last_message_at' => 'datetime'];

    /** Quotable on a phone call, so assigned once and never recomputed. */
    protected static function booted(): void
    {
        static::created(function (SupportTicket $t) {
            if (!$t->code) $t->forceFill(['code' => 'SUP-' . (100000 + $t->id)])->saveQuietly();
        });
    }

    public function user()       { return $this->belongsTo(User::class); }
    public function enrollment() { return $this->belongsTo(Enrollment::class); }
    public function messages()   { return $this->hasMany(SupportMessage::class, 'ticket_id')->orderBy('id'); }

    /** Waiting on us, oldest first — the order staff should work it in. */
    public function scopeNeedsReply($q) { return $q->where('status', 'open')->orderBy('last_message_at'); }

    /**
     * Record a message and move the ticket's state with it. Kept here so the
     * two can never drift: a reply that leaves the status stale is how a queue
     * quietly stops reflecting reality.
     */
    public function addMessage(string $body, ?User $author, bool $isStaff): SupportMessage
    {
        $message = $this->messages()->create([
            'user_id'      => $author?->id,
            'is_staff'     => $isStaff,
            'author_label' => $isStaff ? ($author?->name ?? 'IndiaTutors team') : ($author?->name ?? $this->name),
            'body'         => $body,
        ]);

        $this->forceFill([
            // A closed ticket that gets a new message is open again — for either
            // side. Someone writing back is the definition of not being done.
            'status'          => $isStaff ? 'answered' : 'open',
            'last_message_at' => $message->created_at,
        ])->save();

        return $message;
    }
}
