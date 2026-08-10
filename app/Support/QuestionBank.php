<?php

namespace App\Support;

use App\Models\Question;
use App\Models\QuestionAttempt;
use Illuminate\Support\Collection;

/**
 * F7 + F8 — the difficulty ladder, and what a score is allowed to mean.
 *
 * The thresholds and level count live here and nowhere else. A pass mark
 * duplicated in the scoring code and again in the UI copy is a number that will
 * eventually disagree with itself, and the disagreement will be invisible: both
 * sides look right in isolation.
 */
class QuestionBank
{
    public const LEVELS = [1, 2, 3];

    /**
     * The 60 / 80 / 90 from the founder's page, read as bands rather than a
     * single pass mark:
     *
     *   below 60  — weak. The material did not land; repeat it.
     *   60 to 79  — passed, but not ready to move up a level.
     *   80 to 89  — solid. Unlock the next level.
     *   90+       — mastered.
     */
    public const WEAK      = 60;
    public const PASS      = 60;
    public const ADVANCE   = 80;
    public const MASTERED  = 90;

    /** A topic needs this many answers before we are willing to call it weak. */
    public const MIN_ANSWERS_FOR_VERDICT = 3;

    public static function band(float $percent): string
    {
        if ($percent >= self::MASTERED) return 'mastered';
        if ($percent >= self::ADVANCE)  return 'strong';
        if ($percent >= self::PASS)     return 'passed';
        return 'weak';
    }

    /**
     * The highest level this user has earned on a lesson, and the next one they
     * may attempt.
     *
     * A level is unlocked by scoring ADVANCE (80) on the level below — passing
     * at 60 is enough to move on with the lesson but not to be handed harder
     * questions, which is the distinction the three bands exist to make.
     */
    public static function unlockedLevel(int $userId, int $lessonId): int
    {
        $unlocked = 1;
        foreach (self::LEVELS as $level) {
            $score = self::bestScore($userId, $lessonId, $level);
            if ($score !== null && $score >= self::ADVANCE) {
                $unlocked = min($level + 1, max(self::LEVELS));
                continue;
            }
            break;
        }
        return $unlocked;
    }

    /** Best percentage this user has scored on one level of one lesson, or null. */
    public static function bestScore(int $userId, int $lessonId, int $level): ?float
    {
        $rows = QuestionAttempt::query()
            ->where('question_attempts.user_id', $userId)
            ->where('question_attempts.level', $level)
            ->whereNotNull('attempt_group')
            ->join('questions', 'questions.id', '=', 'question_attempts.question_id')
            ->where('questions.video_lesson_id', $lessonId)
            ->selectRaw('attempt_group, COUNT(*) as total, SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct')
            ->groupBy('attempt_group')
            ->get();

        if ($rows->isEmpty()) {
            return null;
        }

        return (float) $rows->map(fn ($r) => $r->total > 0 ? ($r->correct / $r->total) * 100 : 0)->max();
    }

    /**
     * F8 — which topics this student is weak in.
     *
     * Computed from individual answers rather than a stored average, because
     * "scored 70%" tells a parent nothing actionable. Topics below MIN_ANSWERS
     * are reported as `unproven` rather than weak: calling a child weak at
     * fractions on the strength of one wrong answer is both wrong and the kind
     * of number this project has had to delete before.
     *
     * @return array{topics: array, overall: array|null}
     */
    public static function weakAreas(int $userId, ?int $studentId = null): array
    {
        $rows = QuestionAttempt::query()
            ->where('user_id', $userId)
            ->when($studentId, fn ($q) => $q->where('student_id', $studentId))
            ->whereNotNull('topic')
            ->selectRaw('topic, COUNT(*) as answered, SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct')
            ->groupBy('topic')
            ->get();

        $topics = $rows->map(function ($r) {
            $pct = $r->answered > 0 ? round(($r->correct / $r->answered) * 100) : 0;
            $proven = $r->answered >= self::MIN_ANSWERS_FOR_VERDICT;
            return [
                'topic'    => $r->topic,
                'answered' => (int) $r->answered,
                'correct'  => (int) $r->correct,
                'percent'  => $pct,
                // Honest about its own confidence.
                'band'     => $proven ? self::band($pct) : 'unproven',
            ];
        })->sortBy([
            fn ($a, $b) => ($a['band'] === 'unproven') <=> ($b['band'] === 'unproven'),
            fn ($a, $b) => $a['percent'] <=> $b['percent'],
        ])->values()->all();

        $answered = array_sum(array_column($topics, 'answered'));
        $correct  = array_sum(array_column($topics, 'correct'));

        return [
            'topics'  => $topics,
            'overall' => $answered > 0 ? [
                'answered' => $answered,
                'correct'  => $correct,
                'percent'  => round(($correct / $answered) * 100),
                'band'     => self::band(($correct / $answered) * 100),
            ] : null,
        ];
    }

    /** Score one submitted sitting. */
    public static function scoreAttempt(Collection $attempts): array
    {
        $total   = $attempts->count();
        $correct = $attempts->where('is_correct', true)->count();
        $percent = $total > 0 ? round(($correct / $total) * 100) : 0;

        return [
            'total'    => $total,
            'correct'  => $correct,
            'percent'  => $percent,
            'band'     => self::band($percent),
            'advanced' => $percent >= self::ADVANCE,
        ];
    }
}
