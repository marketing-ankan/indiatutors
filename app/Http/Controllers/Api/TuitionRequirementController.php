<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\TuitionRequirementResource;
use App\Models\Student;
use App\Models\TuitionRequirement;
use App\Support\GradeScale;
use App\Support\PincodeDirectory;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * The student side of a physical match: an open "I need a home tutor for X"
 * requirement.
 *
 * Works signed-in (attached to a student profile on the dashboard) and signed-
 * out (the public form on /physical-classes) — a family looking for a tutor
 * should not have to register first, and the lead is worth more than the
 * account.
 */
class TuitionRequirementController extends Controller
{
    public const GOALS    = ['board_exam', 'competitive', 'remedial', 'homework', 'skill', 'other'];
    public const URGENCY  = ['immediate', 'within_week', 'within_month', 'flexible'];
    public const VENUES   = ['student_home', 'teacher_place', 'either'];

    public static function rules(bool $guest = false): array
    {
        return [
            'student_id'   => ['nullable', 'integer', 'exists:students,id'],

            'contact_name'      => [$guest ? 'required' : 'nullable', 'string', 'max:120'],
            'contact_phone'     => [$guest ? 'required' : 'nullable', 'string', 'max:30'],
            'contact_email'     => ['nullable', 'email', 'max:190'],
            'relationship'      => ['nullable', Rule::in(['parent', 'guardian', 'self'])],
            'whatsapp_consent'  => ['nullable', 'boolean'],
            'best_time_to_call' => ['nullable', 'string', 'max:60'],

            'learner_name'   => ['nullable', 'string', 'max:120'],
            'learner_gender' => ['nullable', Rule::in(['female', 'male', 'other', 'undisclosed'])],
            'learner_dob'    => ['nullable', 'date', 'before:today'],
            'grade'          => ['nullable', 'integer', 'min:0', 'max:13'],
            'board'          => ['nullable', 'string', 'max:40'],
            'school'         => ['nullable', 'string', 'max:190'],
            'medium'         => ['nullable', 'string', 'max:60'],
            'languages'      => ['nullable', 'array', 'max:10'],
            'languages.*'    => ['string', 'max:60'],
            'learner_count'  => ['nullable', 'integer', 'min:1', 'max:20'],

            'subjects'           => ['required', 'array', 'min:1', 'max:15'],
            'subjects.*'         => ['string', 'max:120'],
            'goal'               => ['nullable', Rule::in(self::GOALS)],
            'exam_target'        => ['nullable', 'string', 'max:120'],
            'focus_areas'        => ['nullable', 'string', 'max:1000'],
            'special_needs'      => ['nullable', 'boolean'],
            'special_needs_note' => ['nullable', 'string', 'max:1000'],

            'address_line1' => ['nullable', 'string', 'max:190'],
            'address_line2' => ['nullable', 'string', 'max:190'],
            'landmark'      => ['nullable', 'string', 'max:190'],
            'locality'      => ['nullable', 'string', 'max:120'],
            'city'          => ['nullable', 'string', 'max:120'],
            'district'      => ['nullable', 'string', 'max:120'],
            'state'         => ['nullable', 'string', 'max:120'],
            'pincode'       => ['required', 'digits:6'],
            'country'       => ['nullable', 'string', 'max:60'],
            'latitude'      => ['nullable', 'numeric', 'between:-90,90'],
            'longitude'     => ['nullable', 'numeric', 'between:-180,180'],
            'geo_source'    => ['nullable', Rule::in(['device', 'pincode', 'approx', 'manual'])],

            'venue_preference'        => ['nullable', Rule::in(self::VENUES)],
            'max_teacher_distance_km' => ['nullable', 'integer', 'min:1', 'max:100'],
            'willing_to_travel_km'    => ['nullable', 'integer', 'min:0', 'max:100'],

            'preferred_days'                 => ['nullable', 'array', 'max:7'],
            'preferred_days.*'               => ['integer', 'min:1', 'max:7'],
            'preferred_time_windows'         => ['nullable', 'array', 'max:8'],
            'preferred_time_windows.*.start' => ['required', 'string', 'max:5'],
            'preferred_time_windows.*.end'   => ['required', 'string', 'max:5'],
            'sessions_per_week' => ['nullable', 'integer', 'min:1', 'max:14'],
            'session_minutes'   => ['nullable', 'integer', 'min:30', 'max:300'],
            'start_date'        => ['nullable', 'date'],
            'urgency'           => ['nullable', Rule::in(self::URGENCY)],

            'budget_min_hourly' => ['nullable', 'numeric', 'min:0', 'max:100000'],
            'budget_max_hourly' => ['nullable', 'numeric', 'min:0', 'max:100000'],
            'budget_monthly'    => ['nullable', 'numeric', 'min:0', 'max:1000000'],

            'preferred_teacher_gender'      => ['nullable', Rule::in(['any', 'female', 'male'])],
            'preferred_teacher_languages'   => ['nullable', 'array', 'max:10'],
            'preferred_teacher_languages.*' => ['string', 'max:60'],
            'min_teacher_experience'        => ['nullable', 'integer', 'min:0', 'max:50'],
            'group_ok'                      => ['nullable', 'boolean'],

            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }

    /** Signed-in: the requirements this account owns, newest first. */
    public function index(Request $request)
    {
        return TuitionRequirementResource::collection(
            TuitionRequirement::where('user_id', $request->user()->id)->latest('id')->get()
        );
    }

    public function store(Request $request)
    {
        $guest = !$request->user();
        $data  = $this->validated($request, $guest);

        if ($guest) {
            // A guest has no account, so it can never legitimately name a
            // student row — and `exists:students,id` only proves the id is real,
            // not that it is theirs. Left in, a guest could point their lead at
            // any child's profile, and the export dereferences that FK
            // (student_code, and the child's name when learner_name is blank),
            // pulling another family's details into a stranger's record.
            // Same guard, same reason as DemoRequestController::store.
            unset($data['student_id']);
        } else {
            $data['user_id'] = $request->user()->id;
            $this->authorizeStudent($request, $data['student_id'] ?? null);
            // Fall back to the account's own details so a signed-in parent is
            // not asked for their phone number again.
            $data['contact_name']  ??= $request->user()->name;
            $data['contact_email'] ??= $request->user()->email;
            $data['contact_phone'] ??= $request->user()->phone;
        }

        $requirement = TuitionRequirement::create($data);

        // Copy the enquiry into the LMS so staff see it there. AFTER the save,
        // best-effort, bounded at ~3s — a dead LMS costs the visitor nothing
        // but latency, never their submission.
        \App\Support\LmsLeadPush::tuitionRequirement($requirement->fresh());

        return (new TuitionRequirementResource($requirement))
            ->additional(['message' => "Requirement {$requirement->fresh()->code} received — our team will match a tutor near you and call you back."])
            ->response()->setStatusCode(201);
    }

    public function update(Request $request, TuitionRequirement $requirement)
    {
        $this->authorizeOwner($request, $requirement);
        $data = $this->validated($request, false);
        $this->authorizeStudent($request, $data['student_id'] ?? null);
        $requirement->update($data);
        return new TuitionRequirementResource($requirement->fresh());
    }

    /** Close it rather than delete it — a matched requirement is history staff needs. */
    public function close(Request $request, TuitionRequirement $requirement)
    {
        $this->authorizeOwner($request, $requirement);
        $requirement->update(['status' => 'closed']);
        return new TuitionRequirementResource($requirement->fresh());
    }

    public function destroy(Request $request, TuitionRequirement $requirement)
    {
        $this->authorizeOwner($request, $requirement);
        $requirement->delete();
        return response()->json(['message' => 'Requirement removed.']);
    }

    private function validated(Request $request, bool $guest): array
    {
        $payload = $request->all();
        // Grade arrives as "Class 10" from the public picker and as an ordinal
        // from the dashboard — normalise before the integer rule sees it.
        if (isset($payload['grade'])) $payload['grade'] = GradeScale::parse($payload['grade']);

        $data = validator($payload, self::rules($guest))->validate();
        $data = PincodeDirectory::enrich($data);

        // Same reasoning as PhysicalProfileWriter::NEVER_NULL — these columns
        // are NOT NULL with a default, and a form that round-trips a
        // never-touched value sends back the null the API gave it.
        foreach (['country', 'learner_count', 'venue_preference', 'preferred_teacher_gender',
                  'whatsapp_consent', 'special_needs', 'group_ok', 'status'] as $key) {
            if (array_key_exists($key, $data) && $data[$key] === null) unset($data[$key]);
        }
        $data['country'] ??= 'India';

        return $data;
    }

    private function authorizeOwner(Request $request, TuitionRequirement $requirement): void
    {
        abort_unless($request->user() && (
            $requirement->user_id === $request->user()->id || $request->user()->isAdmin()
        ), 403);
    }

    private function authorizeStudent(Request $request, $studentId): void
    {
        if (!$studentId) return;
        $student = Student::find($studentId);
        abort_unless($student && (
            $student->user_id === $request->user()?->id
            || $student->account_user_id === $request->user()?->id
            || $request->user()?->isAdmin()
        ), 403, 'That student is not on your account.');
    }
}
