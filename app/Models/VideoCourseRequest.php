<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

/**
 * A vote for a recorded course that does not exist yet.
 *
 * See the migration for why this is its own table rather than a support ticket:
 * nobody is waiting on a reply, so it must not sit in a queue that measures
 * unanswered people.
 */
class VideoCourseRequest extends Model
{
    public const STATUSES = ['new', 'reviewed', 'planned', 'declined'];

    protected $fillable = [
        'user_id', 'name', 'email', 'phone', 'subject', 'subject_key', 'level',
        'message', 'video_course_id', 'notify_me', 'status', 'source',
    ];

    protected $casts = ['notify_me' => 'boolean'];

    public function user()        { return $this->belongsTo(User::class); }
    public function videoCourse() { return $this->belongsTo(VideoCourse::class); }

    /**
     * The subject, reduced to something that groups sensibly.
     *
     * Counting raw free text would scatter one subject across a dozen rows —
     * "Class 10 Maths", "class 10 math", "Maths (10th)" are one request as far
     * as a production decision is concerned, and a demand report that splits
     * them understates the very thing it exists to measure.
     *
     * Deliberately cruder than TutorMatcher's tokeniser: that one decides who
     * teaches a child and must not over-merge, while this one only has to make
     * a bar chart honest. It is stored, not computed at read time, so the
     * grouping cannot silently change under historical rows.
     */
    public static function normaliseSubject(string $raw): string
    {
        $s = Str::lower(trim($raw));
        $s = preg_replace('/\s+/', ' ', $s);
        $s = str_replace(['maths', 'mathematic'], ['math', 'math'], $s);

        // Drop the words that describe the enquiry rather than the subject.
        $noise = ['class', 'grade', 'std', 'standard', 'for', 'the', 'my', 'kid',
                  'kids', 'child', 'course', 'video', 'recorded', 'online', 'tuition'];
        $words = collect(preg_split('/[^a-z0-9+#]+/u', $s, -1, PREG_SPLIT_NO_EMPTY))
            ->reject(fn ($w) => in_array($w, $noise, true))
            ->reject(fn ($w) => ctype_digit($w));

        return $words->isEmpty() ? $s : $words->implode(' ');
    }

    protected static function booted(): void
    {
        // Normalise on the way in, so the demand report groups on a stored
        // value rather than re-deriving one that could drift between reads.
        static::saving(function (VideoCourseRequest $r) {
            $r->source      = $r->source ?: 'video_coming_soon';
            $r->subject_key = self::normaliseSubject((string) $r->subject);
        });
    }
}
