<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class DemoRequest extends Model {
    /** The five booking flows the public form offers. */
    public const TYPES = ['demo','group','workshop','free','physical'];

    /**
     * The demo lifecycle, in order. Previously this vocabulary existed only as
     * a literal inside AdminController's validate() call and again as a chip
     * list in the console — so the two could drift, and adding a state meant
     * finding both. One list, imported by everything.
     *
     *   new       booked, nobody has acted on it yet
     *   contacted the family has been reached; a slot is being agreed
     *   scheduled a time is fixed
     *   completed THE DEMO HAPPENED. The pivotal state: it is the denominator
     *             of the conversion rate and the gate on leaving a review.
     *   converted became a regular enrolment (implies it happened)
     *   no_show   scheduled, then nobody attended — deliberately NOT `closed`,
     *             because a no-show must not count against a teacher's
     *             conversion rate the way a held-but-unsold demo does
     *   closed    ended for any other reason
     */
    public const STATUSES = ['new','contacted','scheduled','completed','converted','no_show','closed'];

    /** States that prove the demo actually took place. */
    public const HELD = ['completed','converted'];

    protected $fillable = ['user_id','student_id','assigned_tutor_id','requested_tutor_id','name','email','phone_country_code','phone','subject','grade','board','mode','city','country','timezone','message','whatsapp_consent','marketing_consent','course_id','status','type','scheduled_at','completed_at'];
    protected $casts = ['whatsapp_consent'=>'boolean','marketing_consent'=>'boolean','scheduled_at'=>'datetime','completed_at'=>'datetime'];

    public function user()          { return $this->belongsTo(User::class); }
    public function student()       { return $this->belongsTo(Student::class); }
    public function course()        { return $this->belongsTo(Course::class); }
    public function assignedTutor() { return $this->belongsTo(Tutor::class, 'assigned_tutor_id'); }
    /** The teacher the student picked when booking — see the migration for why this is not assignedTutor. */
    public function requestedTutor(){ return $this->belongsTo(Tutor::class, 'requested_tutor_id'); }
    public function enrollment()    { return $this->hasOne(Enrollment::class); }

    /** Demos that provably took place — the honest conversion denominator. */
    public function scopeHeld($q) { return $q->whereIn('status', self::HELD); }

    /**
     * Who gets the credit (or the blame) for this demo. The assigned tutor is
     * who actually taught it; the requested tutor is who the student chose.
     * Assignment wins when both are set, because the ranking should reflect
     * the teacher the family really met.
     */
    public function creditedTutorId(): ?int
    {
        return $this->assigned_tutor_id ?: $this->requested_tutor_id;
    }
}
