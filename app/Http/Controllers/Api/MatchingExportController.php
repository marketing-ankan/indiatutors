<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\PhysicalTeachingProfile;
use App\Models\TuitionRequirement;
use App\Services\PhysicalProfileWriter;
use App\Support\Availability;
use App\Support\GradeScale;
use Illuminate\Http\Request;

/**
 * /api/matching/v1/* — the read model the external teacher-assignment app
 * consumes. Key-authed (see EnsureMatchingClient).
 *
 * Design rules this endpoint keeps, because the consumer is a program and not
 * a page:
 *
 *  - **Stable ids.** `teacher:{id}` / `requirement:{id}` never change or get
 *    reused, so the other side can hold its own state against them.
 *  - **Incremental.** `?updated_since=` + `?page=` — a nightly full re-read of
 *    every address is both slow and a needless exposure.
 *  - **Flat and pre-resolved.** Coordinates, grade ordinals and availability
 *    ranges are computed here, so the matcher never has to re-parse "5-8pm
 *    weekdays" or guess what "Class X" means.
 *  - **Honest about precision.** Every coordinate carries `geo_source`, so a
 *    pincode centroid is never mistaken for a doorstep.
 */
class MatchingExportController extends Controller
{
    private const PER_PAGE = 100;

    /**
     * The vocabulary both sides must agree on. Read this once at start-up
     * instead of hard-coding our enum strings in the other codebase.
     */
    public function reference()
    {
        return response()->json([
            'version' => '1.0',
            'grades'  => GradeScale::all(),
            'boards'  => ['CBSE', 'ICSE', 'ISC', 'IGCSE', 'IB', 'NIOS', 'State Board', 'Other'],
            'subjects'=> Category::query()->whereNotNull('parent_id')->orderBy('name')->pluck('name')->unique()->values(),
            'enums'   => [
                'profile_status'           => PhysicalProfileWriter::STATUSES,
                'requirement_status'       => ['open', 'matched', 'on_hold', 'closed'],
                // Two different vocabularies, and conflating them builds a
                // broken picker: a person's own gender allows other/undisclosed,
                // but a *preference* about who to teach or be taught by is a
                // filter, and there "no preference" is the meaningful extra value.
                'gender'                   => PhysicalProfileWriter::GENDERS,
                'preference_gender'        => ['any', 'female', 'male'],
                'travel_mode'              => PhysicalProfileWriter::TRAVEL_MODES,
                'geo_source'               => PhysicalProfileWriter::GEO_SOURCES,
                'offering_level'           => PhysicalProfileWriter::LEVELS,
                'venue_preference'         => TuitionRequirementController::VENUES,
                'goal'                     => TuitionRequirementController::GOALS,
                'urgency'                  => TuitionRequirementController::URGENCY,
                'weekday'                  => ['1=Mon', '2=Tue', '3=Wed', '4=Thu', '5=Fri', '6=Sat', '7=Sun'],
            ],
            'notes' => [
                'grades'      => 'Ordinal scale: 0 = pre-primary, 1-12 = Class 1-12, 13 = above Class 12.',
                'gender'      => 'Use `gender` for person.gender. Use `preference_gender` for preferences.student_gender and teacher_preferences.gender — those accept "any" and never "other"/"undisclosed".',
                'subjects'    => 'Our catalogue, offered as suggestions in the pickers — NOT a closed set. Both forms accept free text, so match subject strings case-insensitively and expect values outside this list.',
                'geo_source'  => 'device = browser GPS fix (metres). pincode = pincode centroid (~1 km). approx = averaged from the 3-digit postal district (~15 km). manual = staff entered.',
                'radius'      => 'service_radius_km is measured from the teacher coordinate. extra_pincodes are opt-ins OUTSIDE that circle and should be treated as reachable regardless of distance.',
                'availability'=> 'Weekly recurring ranges. `exceptions` override them for a single date; is_available=false means blocked.',
            ],
        ]);
    }

    public function teachers(Request $request)
    {
        // ?near=<pincode> switches the endpoint from sync-feed mode to
        // suggestion mode — see nearTeachers(). Kept as a mode of the same
        // route so the consumer needs exactly one URL and one key.
        if ($request->filled('near')) {
            return $this->nearTeachers($request);
        }

        $q = PhysicalTeachingProfile::query()
            ->with(['offerings', 'slots', 'exceptions', 'user:id,name,email,phone'])
            ->when($request->filled('status'), fn ($b) => $b->where('status', $request->string('status')),
                                               fn ($b) => $b->where('status', 'active'))
            ->when($request->filled('updated_since'), fn ($b) => $b->where('updated_at', '>=', $request->date('updated_since')))
            ->when($request->filled('pincode'), fn ($b) => $b->where('pincode', $request->string('pincode')))
            ->when($request->filled('state'),   fn ($b) => $b->where('state', $request->string('state')))
            ->orderBy('updated_at')->orderBy('id');

        $page = $q->paginate(min((int) $request->integer('per_page', self::PER_PAGE), 500));

        return response()->json([
            'data' => collect($page->items())->map(fn ($p) => $this->teacherPayload($p))->all(),
            'meta' => $this->meta($page),
        ]);
    }

    /**
     * Suggestion mode: teachers who can plausibly serve ?near=<pincode>,
     * ranked by distance, each row annotated with WHY it qualifies.
     *
     * This lives on the SITE and not in the consumer because only the site
     * has the pincode centroids (PincodeDirectory) — the LMS sees six digits;
     * the distance math is only honest on this side of the wire. The
     * distances are centroid-to-point or centroid-to-centroid: good to a few
     * km, which is match-shortlist accuracy, not routing accuracy — the
     * `approx` flag says which.
     *
     * A teacher qualifies by any of:
     *   same_pincode    — profile pincode equals the target
     *   listed_pincode  — target appears in extra_pincodes (their explicit
     *                     "I also serve" list; reachable regardless of radius)
     *   within_radius   — haversine distance <= their service_radius_km
     *   nearby          — within ?within_km (default 25, cap 100) but outside
     *                     their stated radius; shown so a coordinator can ask
     *                     "would you stretch 3km for this one?", ranked last
     *
     * ?subject=<name> additionally requires an offering whose subject contains
     * the string case-insensitively.
     */
    private function nearTeachers(Request $request)
    {
        $pin = preg_replace('/\D/', '', (string) $request->string('near'));
        if (strlen($pin) !== 6) {
            return response()->json(['message' => 'near must be a 6-digit pincode'], 422);
        }

        $centre = \App\Support\PincodeDirectory::lookup($pin);
        if (! $centre || ! isset($centre['latitude'], $centre['longitude']) || $centre['latitude'] === null) {
            return response()->json([
                'data' => [],
                'meta' => ['near' => $pin, 'resolved' => false,
                           'note' => 'Unknown pincode — no centroid available, no distance ranking possible.'],
            ]);
        }

        $withinKm = min(max((float) $request->input('within_km', 25), 1), 100);
        $subject  = trim((string) $request->string('subject'));

        $rows = PhysicalTeachingProfile::query()
            ->with(['offerings', 'slots', 'exceptions', 'user:id,name,email,phone'])
            ->where('status', 'active')
            ->when($subject !== '', fn ($b) => $b->whereHas('offerings',
                fn ($o) => $o->where('subject', 'like', "%{$subject}%")))
            ->get()
            ->map(function (PhysicalTeachingProfile $p) use ($pin, $centre, $withinKm) {
                $reasons = [];
                $km      = null;

                if ((string) $p->pincode === $pin) {
                    $reasons[] = 'same_pincode';
                }
                if (in_array($pin, (array) ($p->extra_pincodes ?? []), true)) {
                    $reasons[] = 'listed_pincode';
                }
                if ($p->latitude !== null && $p->longitude !== null) {
                    $km = self::haversineKm(
                        (float) $centre['latitude'], (float) $centre['longitude'],
                        (float) $p->latitude, (float) $p->longitude
                    );
                    if ((float) $p->service_radius_km > 0 && $km <= (float) $p->service_radius_km) {
                        $reasons[] = 'within_radius';
                    } elseif ($km <= $withinKm && ! $reasons) {
                        $reasons[] = 'nearby';
                    }
                }

                return $reasons ? ['profile' => $p, 'km' => $km, 'reasons' => $reasons] : null;
            })
            ->filter()
            // Hard qualifiers first, then plain distance. 'nearby' rows sink.
            ->sortBy([
                fn ($a, $b) => (int) ($a['reasons'] === ['nearby']) <=> (int) ($b['reasons'] === ['nearby']),
                fn ($a, $b) => ($a['km'] ?? 9e9) <=> ($b['km'] ?? 9e9),
            ])
            ->take(min((int) $request->integer('per_page', 25), 100))
            ->values();

        return response()->json([
            'data' => $rows->map(fn ($r) => $this->teacherPayload($r['profile']) + [
                'distance_km' => $r['km'] !== null ? round($r['km'], 1) : null,
                'match'       => $r['reasons'],
            ])->all(),
            'meta' => [
                'near'      => $pin,
                'resolved'  => true,
                'centre'    => ['district' => $centre['district'] ?? null, 'state' => $centre['state'] ?? null],
                'approx'    => ($centre['source'] ?? null) !== 'device',
                'within_km' => $withinKm,
                'count'     => $rows->count(),
            ],
        ]);
    }

    private static function haversineKm(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $r = 6371.0;
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);
        $a = sin($dLat / 2) ** 2
           + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;

        return 2 * $r * asin(min(1.0, sqrt($a)));
    }

    public function teacher(PhysicalTeachingProfile $profile)
    {
        return response()->json(['data' => $this->teacherPayload(
            $profile->load(['offerings', 'slots', 'exceptions', 'user:id,name,email,phone'])
        )]);
    }

    public function requirements(Request $request)
    {
        $q = TuitionRequirement::query()
            ->with(['student:id,code,name', 'user:id,name,email,phone'])
            ->when($request->filled('status'), fn ($b) => $b->where('status', $request->string('status')),
                                               fn ($b) => $b->where('status', 'open'))
            ->when($request->filled('updated_since'), fn ($b) => $b->where('updated_at', '>=', $request->date('updated_since')))
            ->when($request->filled('pincode'), fn ($b) => $b->where('pincode', $request->string('pincode')))
            ->when($request->filled('state'),   fn ($b) => $b->where('state', $request->string('state')))
            ->orderBy('updated_at')->orderBy('id');

        $page = $q->paginate(min((int) $request->integer('per_page', self::PER_PAGE), 500));

        return response()->json([
            'data' => collect($page->items())->map(fn ($r) => $this->requirementPayload($r))->all(),
            'meta' => $this->meta($page),
        ]);
    }

    public function requirement(TuitionRequirement $requirement)
    {
        return response()->json(['data' => $this->requirementPayload(
            $requirement->load(['student:id,code,name', 'user:id,name,email,phone'])
        )]);
    }

    /**
     * Write-back: the assignment app tells us who it picked. Deliberately the
     * only mutation in the export — this system stays the source of truth for
     * everything a human typed, and owns nothing about how the match was made.
     */
    public function updateRequirement(Request $request, TuitionRequirement $requirement)
    {
        $data = validator($request->all(), [
            'status'             => ['nullable', 'in:open,matched,on_hold,closed'],
            'matched_profile_id' => ['nullable', 'integer', 'exists:physical_teaching_profiles,id'],
            'notes'              => ['nullable', 'string', 'max:2000'],
        ])->validate();

        if (!empty($data['matched_profile_id'])) {
            $data['status']     ??= 'matched';
            $data['matched_at']   = now();
        }

        $requirement->update($data);

        return response()->json(['data' => $this->requirementPayload($requirement->fresh())]);
    }

    // ---------------------------------------------------------------- payloads

    private function teacherPayload(PhysicalTeachingProfile $p): array
    {
        $slots = $p->slots->map(fn ($s) => [
            'weekday' => $s->weekday, 'start_time' => $s->start, 'end_time' => $s->end,
        ])->all();

        return [
            'id'            => "teacher:{$p->id}",
            'profile_id'    => $p->id,
            'user_id'       => $p->user_id,
            'application_id'=> $p->teacher_application_id,
            'status'        => $p->status,
            'completeness'  => $p->completeness(),

            'person' => [
                'name'          => $p->user?->name ?? $p->application?->name,
                'email'         => $p->user?->email ?? $p->application?->email,
                'phone'         => $p->user?->phone ?? $p->application?->phone,
                'gender'        => $p->gender,
                'date_of_birth' => $p->date_of_birth?->toDateString(),
                'nationality'   => $p->nationality,
                'languages'     => $p->csv('languages'),
                'experience_years'   => $p->experience_years,
                'police_verified'    => $p->police_verified,
                'police_verified_on' => $p->police_verified_on?->toDateString(),
            ],

            'location' => [
                'address_line1' => $p->address_line1,
                'address_line2' => $p->address_line2,
                'landmark'      => $p->landmark,
                'locality'      => $p->locality,
                'city'          => $p->city,
                'district'      => $p->district,
                'state'         => $p->state,
                'pincode'       => $p->pincode,
                'country'       => $p->country,
                'latitude'      => $p->latitude,
                'longitude'     => $p->longitude,
                'geo_source'    => $p->geo_source,
                'geo_accuracy_m'=> $p->geo_accuracy_m,
            ],

            'service_area' => [
                'radius_km'          => $p->service_radius_km,
                'extra_pincodes'     => $p->csv('extra_pincodes'),
                'travel_mode'        => $p->travel_mode,
                'max_travel_minutes' => $p->max_travel_minutes,
                'travel_outside_city'=> $p->travel_outside_city,
                'travel_fee_per_visit' => $p->travel_fee_per_visit,
                'venues' => array_values(array_filter([
                    $p->at_student_home ? 'student_home' : null,
                    $p->at_own_place    ? 'teacher_place' : null,
                    $p->at_public_place ? 'public_place' : null,
                ])),
                'own_place_capacity' => $p->own_place_capacity,
            ],

            'teaches' => $p->offerings->map(fn ($o) => [
                'subject'          => $o->subject,
                'grade_from'       => $o->grade_from,
                'grade_to'         => $o->grade_to,
                'boards'           => $o->boards ?? [],
                'medium'           => $o->medium,
                'level'            => $o->level,
                'exam_target'      => $o->exam_target,
                'fee_hourly'       => $o->fee_hourly,
                'fee_monthly'      => $o->fee_monthly,
                'experience_years' => $o->experience_years,
                'is_primary'       => $o->is_primary,
            ])->all(),

            'availability' => [
                'weekly'       => $slots,
                'weekly_hours' => Availability::weeklyHours($slots),
                'exceptions'   => $p->exceptions->map(fn ($e) => [
                    'date'         => $e->date?->toDateString(),
                    'is_available' => $e->is_available,
                    'start_time'   => $e->start_time ? substr($e->start_time, 0, 5) : null,
                    'end_time'     => $e->end_time ? substr($e->end_time, 0, 5) : null,
                    'reason'       => $e->reason,
                ])->all(),
                'notice_hours'              => $p->notice_hours,
                'preferred_session_minutes' => $p->preferred_session_minutes,
                'max_hours_per_week'        => $p->max_hours_per_week,
                'available_from'            => $p->available_from?->toDateString(),
                'on_break_until'            => $p->on_break_until?->toDateString(),
            ],

            'preferences' => [
                'student_gender'    => $p->preferred_student_gender,
                'teaches_group'     => $p->teaches_group,
                'max_batch_size'    => $p->max_batch_size,
                'max_students'      => $p->max_students,
                'special_needs_experience' => $p->special_needs_experience,
                'min_fee_hourly'    => $p->min_fee_hourly,
                'min_fee_monthly'   => $p->min_fee_monthly,
            ],

            'notes'      => $p->notes,
            'updated_at' => $p->updated_at?->toIso8601String(),
        ];
    }

    private function requirementPayload(TuitionRequirement $r): array
    {
        return [
            'id'         => "requirement:{$r->id}",
            'code'       => $r->code,
            'requirement_id' => $r->id,
            'status'     => $r->status,
            // Both halves of the write-back are readable, so a consumer can
            // reconcile its own state after an interrupted sync rather than
            // having written a timestamp it can never see again.
            'matched_profile_id' => $r->matched_profile_id,
            'matched_at'         => $r->matched_at?->toIso8601String(),

            'contact' => [
                'name'              => $r->contact_name ?? $r->user?->name,
                'phone'             => $r->contact_phone ?? $r->user?->phone,
                'email'             => $r->contact_email ?? $r->user?->email,
                'relationship'      => $r->relationship,
                'whatsapp_consent'  => $r->whatsapp_consent,
                'best_time_to_call' => $r->best_time_to_call,
            ],

            'learner' => [
                'student_id'    => $r->student_id,
                'student_code'  => $r->student?->code,
                'name'          => $r->learner_name ?? $r->student?->name,
                'gender'        => $r->learner_gender,
                'date_of_birth' => $r->learner_dob?->toDateString(),
                'grade'         => $r->grade,
                'grade_label'   => GradeScale::label($r->grade),
                'board'         => $r->board,
                'school'        => $r->school,
                'medium'        => $r->medium,
                'languages'     => $r->languages ?? [],
                'count'         => $r->learner_count,
                'special_needs' => $r->special_needs,
                'special_needs_note' => $r->special_needs_note,
            ],

            'needs' => [
                'subjects'    => $r->subjects ?? [],
                'goal'        => $r->goal,
                'exam_target' => $r->exam_target,
                'focus_areas' => $r->focus_areas,
                'sessions_per_week' => $r->sessions_per_week,
                'session_minutes'   => $r->session_minutes,
                'start_date'  => $r->start_date?->toDateString(),
                'urgency'     => $r->urgency,
            ],

            'location' => [
                'address_line1' => $r->address_line1,
                'address_line2' => $r->address_line2,
                'landmark'      => $r->landmark,
                'locality'      => $r->locality,
                'city'          => $r->city,
                'district'      => $r->district,
                'state'         => $r->state,
                'pincode'       => $r->pincode,
                'country'       => $r->country,
                'latitude'      => $r->latitude,
                'longitude'     => $r->longitude,
                'geo_source'    => $r->geo_source,
                'venue_preference'        => $r->venue_preference,
                'max_teacher_distance_km' => $r->max_teacher_distance_km,
                'willing_to_travel_km'    => $r->willing_to_travel_km,
            ],

            'schedule' => [
                'preferred_days'         => $r->preferred_days ?? [],
                'preferred_time_windows' => $r->preferred_time_windows ?? [],
            ],

            'budget' => [
                'min_hourly' => $r->budget_min_hourly,
                'max_hourly' => $r->budget_max_hourly,
                'monthly'    => $r->budget_monthly,
            ],

            'teacher_preferences' => [
                'gender'         => $r->preferred_teacher_gender,
                'languages'      => $r->preferred_teacher_languages ?? [],
                'min_experience' => $r->min_teacher_experience,
                'group_ok'       => $r->group_ok,
            ],

            'notes'      => $r->notes,
            'created_at' => $r->created_at?->toIso8601String(),
            'updated_at' => $r->updated_at?->toIso8601String(),
        ];
    }

    private function meta($page): array
    {
        return [
            'page'      => $page->currentPage(),
            'per_page'  => $page->perPage(),
            'total'     => $page->total(),
            'last_page' => $page->lastPage(),
            // The cursor to hand back next time. Reading it from the last row
            // rather than "now" means a record written mid-page is not skipped.
            'checkpoint'=> collect($page->items())->max('updated_at')?->toIso8601String(),
        ];
    }
}
