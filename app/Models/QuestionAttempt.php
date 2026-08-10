<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * One answer to one question (F7/F8).
 *
 * Kept per answer rather than as a running score, because F8 has to say WHICH
 * areas a student is weak in — an average cannot answer that.
 */
class QuestionAttempt extends Model
{
    protected $fillable = [
        'user_id', 'student_id', 'question_id', 'level', 'topic',
        'chosen_key', 'is_correct', 'attempt_group',
    ];

    protected $casts = ['is_correct' => 'boolean', 'level' => 'integer'];

    public function question() { return $this->belongsTo(Question::class); }
    public function user()     { return $this->belongsTo(User::class); }
    public function student()  { return $this->belongsTo(Student::class); }
}
