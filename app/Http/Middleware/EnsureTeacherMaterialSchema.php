<?php
namespace App\Http\Middleware;

use App\Support\SchemaHealer;
use Closure;
use Illuminate\Http\Request;

/**
 * Guards the staff Materials tab.
 *
 * teacher_course_grants ships with this feature, and on this host a deploy's
 * `migrate` step can die or time out after the app code is already live — see
 * App\Support\SchemaHealer. Without this the whole tab 500s on an unknown table
 * while the support and home-tuition tabs beside it degrade to an honest 503,
 * and the one screen that can hand a teacher their syllabus is the screen that
 * cannot say why it is unavailable.
 *
 * Healing here also repairs the teacher-facing half: CourseMaterial::courseIdsFor
 * falls back to enrolment-derived access while the table is missing, so the first
 * staff visit restores granted access without anyone redeploying.
 */
class EnsureTeacherMaterialSchema
{
    public function handle(Request $request, Closure $next)
    {
        SchemaHealer::ensure(['teacher_course_grants'], 'teacher_materials', 'Teacher materials');

        return $next($request);
    }
}
