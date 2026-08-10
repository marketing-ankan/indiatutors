<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Question;
use App\Models\QuestionAttempt;
use App\Models\VideoLesson;
use App\Support\QuestionBank;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * F7 + F8 — the question bank a learner sits, and the weakness it reveals.
 *
 * Built ahead of the rest of track F because it needs no AI provider: F2-F6 are
 * blocked on a Gemini key, while a ladder of multiple-choice questions and a
 * score threshold are ordinary logic. Shipping it now also means the answer
 * history F8 reasons over starts accumulating before the AI arrives.
 */
class QuestionController extends Controller
{
    /**
     * The paper for one lesson at the level this learner has earned.
     *
     * Correct answers are never in this payload — see Question::toStudentArray.
     */
    public function forLesson(Request $request, VideoLesson $lesson)
    {
        $user  = $request->user();
        $level = (int) ($request->integer('level') ?: QuestionBank::unlockedLevel($user->id, $lesson->id));
        $level = max(1, min($level, max(QuestionBank::LEVELS)));

        abort_if($level > QuestionBank::unlockedLevel($user->id, $lesson->id), 422,
            'Score ' . QuestionBank::ADVANCE . '% on the level below to unlock this one.');

        $questions = Question::published()
            ->where('video_lesson_id', $lesson->id)
            ->where('level', $level)
            ->orderBy('position')->orderBy('id')
            ->get();

        return response()->json([
            'data' => $questions->map(fn (Question $q) => $q->toStudentArray())->all(),
            'meta' => [
                'level'           => $level,
                'unlocked_level'  => QuestionBank::unlockedLevel($user->id, $lesson->id),
                'levels'          => QuestionBank::LEVELS,
                'best_score'      => QuestionBank::bestScore($user->id, $lesson->id, $level),
                'advance_at'      => QuestionBank::ADVANCE,
            ],
        ]);
    }

    /**
     * Submit a sitting. Scored server-side from the stored key — a client that
     * marks its own paper is not a diagnostic.
     */
    public function submit(Request $request, VideoLesson $lesson)
    {
        $data = $request->validate([
            'answers'              => 'required|array|min:1|max:50',
            'answers.*.question_id'=> 'required|integer',
            'answers.*.chosen_key' => 'nullable|string|max:8',
            'student_id'           => 'nullable|integer',
        ]);

        $user  = $request->user();
        $ids   = collect($data['answers'])->pluck('question_id')->unique();

        // Only questions that really belong to this lesson, so a crafted payload
        // cannot mix in another lesson's easy questions to inflate a score.
        $questions = Question::published()
            ->where('video_lesson_id', $lesson->id)
            ->whereIn('id', $ids)
            ->get()->keyBy('id');

        abort_if($questions->isEmpty(), 422, 'No valid questions in this submission.');

        // A student may only be named if this account owns them.
        $studentId = $data['student_id'] ?? null;
        if ($studentId && ! in_array((int) $studentId, $user->students()->pluck('id')->all(), true)) {
            $studentId = null;
        }

        $group = (string) Str::uuid();

        $attempts = collect($data['answers'])
            ->filter(fn ($a) => $questions->has($a['question_id']))
            ->map(function ($a) use ($questions, $user, $studentId, $group) {
                $q = $questions[$a['question_id']];
                return QuestionAttempt::create([
                    'user_id'       => $user->id,
                    'student_id'    => $studentId,
                    'question_id'   => $q->id,
                    'level'         => $q->level,
                    'topic'         => $q->topic,
                    'chosen_key'    => $a['chosen_key'] ?? null,
                    'is_correct'    => ($a['chosen_key'] ?? null) !== null
                                        && $a['chosen_key'] === $q->correct_key,
                    'attempt_group' => $group,
                ]);
            });

        $result = QuestionBank::scoreAttempt($attempts);

        return response()->json([
            'data' => $result + [
                'unlocked_level' => QuestionBank::unlockedLevel($user->id, $lesson->id),
                // The explanation is released only now the paper is submitted —
                // this is the teaching moment, and it cannot be used to cheat.
                'review' => $attempts->map(function (QuestionAttempt $a) use ($questions) {
                    $q = $questions[$a->question_id];
                    return [
                        'question_id' => $q->id,
                        'prompt'      => $q->prompt,
                        'your_answer' => $a->chosen_key,
                        'correct_key' => $q->correct_key,
                        'is_correct'  => $a->is_correct,
                        'explanation' => $q->explanation,
                    ];
                })->values()->all(),
            ],
        ], 201);
    }

    /** F8 — where this learner is weak, per topic. */
    public function weakAreas(Request $request)
    {
        $studentId = $request->integer('student_id') ?: null;
        if ($studentId && ! in_array((int) $studentId, $request->user()->students()->pluck('id')->all(), true)) {
            abort(403, 'That student is not on your account.');
        }

        return response()->json([
            'data' => QuestionBank::weakAreas($request->user()->id, $studentId),
            'meta' => [
                'weak_below'   => QuestionBank::WEAK,
                'strong_at'    => QuestionBank::ADVANCE,
                'mastered_at'  => QuestionBank::MASTERED,
                'min_answers'  => QuestionBank::MIN_ANSWERS_FOR_VERDICT,
            ],
        ]);
    }
}
