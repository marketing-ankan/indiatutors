<?php

namespace App\Support;

use App\Models\ClassAbsence;
use App\Models\ClassLog;
use App\Models\ClassMaterial;
use App\Models\CourseMaterial;
use App\Models\DemoRequest;
use App\Models\Enrollment;
use App\Models\Student;
use App\Models\StudentAchievement;

/**
 * E6 — "my learning so far" for one student.
 *
 * Owner, 2026-08-10: how many classes attended, how many materials they hold,
 * "these type of things, personal details".
 *
 * EVERY NUMBER HERE IS COUNTED, NEVER ESTIMATED. This project has twice had to
 * delete invented figures — fabricated ratings in August, and the placeholder
 * testimonials E7 replaces. A progress card is exactly the surface where a
 * plausible-looking number would never be questioned, so anything that cannot
 * be counted from a real row is simply absent.
 *
 * Attendance comes from class_logs, which a teacher writes after teaching, and
 * counts only `completed` — a `scheduled` row is an intention, and counting it
 * would inflate the figure the moment a class is booked. `missed` is reported
 * separately rather than folded away, because a family is entitled to see it.
 */
class StudentRecord
{
    public static function forStudent(Student $student): array
    {
        $enrollmentIds = Enrollment::where('student_id', $student->id)->pluck('id');

        $logs = ClassLog::whereIn('enrollment_id', $enrollmentIds);

        $attended = (int) $logs->clone()->where('status', 'completed')->count();
        $missed   = (int) $logs->clone()->where('status', 'missed')->count();
        $minutes  = (int) $logs->clone()->where('status', 'completed')->sum('duration_min');

        // Materials the student can actually open, counted the same way the
        // materials endpoint decides access — company decks for courses they
        // are enrolled in, plus their teachers' own uploads.
        $courseIds = Enrollment::where('student_id', $student->id)
            ->where('status', 'active')->whereNotNull('course_id')
            ->pluck('course_id')->unique();

        $companyMaterials = $courseIds->isEmpty() ? 0
            : (int) CourseMaterial::published()->whereIn('course_id', $courseIds)->count();
        $classMaterials   = (int) ClassMaterial::whereIn('enrollment_id', $enrollmentIds)->count();

        return [
            'student'      => ['id' => $student->id, 'name' => $student->name, 'grade' => $student->grade],
            'classes'      => [
                'attended' => $attended,
                'missed'   => $missed,
                'hours'    => $minutes > 0 ? round($minutes / 60, 1) : 0,
            ],
            'materials'    => [
                'total'    => $companyMaterials + $classMaterials,
                'course'   => $companyMaterials,
                'from_teacher' => $classMaterials,
            ],
            'enrollments'  => [
                'active' => (int) Enrollment::where('student_id', $student->id)->where('status', 'active')->count(),
                'total'  => $enrollmentIds->count(),
            ],
            'demos'        => [
                // Held, not booked: a demo that never happened says nothing
                // about this student's learning.
                'attended' => (int) DemoRequest::where('student_id', $student->id)->held()->count(),
            ],
            'achievements' => [
                'total'    => (int) StudentAchievement::where('student_id', $student->id)->count(),
                'approved' => (int) StudentAchievement::where('student_id', $student->id)->approved()->count(),
            ],
            // Cover a family should know about: classes their teacher could not
            // take. Shown because it is their class that changed, not an
            // internal operations detail.
            'substitutions' => (int) ClassAbsence::whereIn('enrollment_id', $enrollmentIds)
                ->whereIn('status', ClassAbsence::GOES_AHEAD)->count(),
        ];
    }
}
