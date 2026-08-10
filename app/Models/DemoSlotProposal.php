<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * A proposed time for a demo class.
 *
 * The founder's flow is "teacher contacts the family, under the coordinator's
 * guidance, and a time gets agreed". Recording that as rows rather than as a
 * sentence in a notes box is what lets the system answer, months later, who
 * offered what and who accepted it — and it lets the whole negotiation happen
 * without the teacher ever needing the family's phone number.
 */
class DemoSlotProposal extends Model
{
    /** Who put this slot forward. Not who it is for. */
    public const SOURCES  = ['teacher', 'coordinator'];

    /**
     * `superseded` is distinct from `declined` on purpose: declined means the
     * family said no, superseded means a later agreement replaced it. Collapsing
     * the two would put words in a parent's mouth in the record.
     */
    public const STATUSES = ['proposed', 'accepted', 'declined', 'withdrawn', 'superseded'];

    /** Statuses that still occupy the teacher's calendar for this demo. */
    public const LIVE = ['proposed', 'accepted'];

    protected $fillable = [
        'demo_request_id', 'proposed_by', 'source',
        'starts_at', 'duration_minutes', 'note', 'status', 'responded_at',
    ];

    protected $casts = [
        'starts_at'        => 'datetime',
        'responded_at'     => 'datetime',
        'duration_minutes' => 'integer',
    ];

    public function demoRequest() { return $this->belongsTo(DemoRequest::class); }
    public function proposer()    { return $this->belongsTo(User::class, 'proposed_by'); }

    /** Still awaiting the family's answer. */
    public function scopeOpen($q) { return $q->where('status', 'proposed'); }

    /** Proposed or accepted — everything a new agreement has to clear out. */
    public function scopeLive($q) { return $q->whereIn('status', self::LIVE); }
}
