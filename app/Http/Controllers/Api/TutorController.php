<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Http\Resources\TutorResource;
use App\Models\Tutor;
use App\Support\TeacherPerformance;
use App\Support\TutorMatcher;
use Illuminate\Http\Request;

class TutorController extends Controller {
    public function index(Request $request) {
        $query = Tutor::query()->published();

        if ($subject = $request->string('subject')->toString()) {
            $query->where('subjects', 'like', "%{$subject}%");
        }
        if ($city = $request->string('city')->toString()) {
            $query->where('city', $city);
        }
        if ($mode = $request->string('mode')->toString()) {
            // "both" tutors match either filter
            $query->where(fn($q) => $q->where('teaching_mode', $mode)->orWhere('teaching_mode', 'both'));
        }
        // Physical-classes filters: home-tuition-capable, grade taught, and the
        // pincode the tutor serves (matched against their CSV service areas).
        if ($request->boolean('home')) {
            $query->whereIn('teaching_mode', ['home', 'both']);
        }
        if ($grade = $request->string('grade')->toString()) {
            $query->where('grades', 'like', "%{$grade}%");
        }
        if ($pincode = $request->string('pincode')->toString()) {
            $query->where('pincodes', 'like', "%{$pincode}%");
        }
        if ($q = $request->string('search')->toString()) {
            $query->where(fn($s) => $s->where('name','like',"%$q%")
                ->orWhere('subjects','like',"%$q%")
                ->orWhere('tagline','like',"%$q%"));
        }

        match ($request->string('sort','default')->toString()) {
            'fee_asc'  => $query->orderBy('fee_hourly'),
            'fee_desc' => $query->orderByDesc('fee_hourly'),
            'name'     => $query->orderBy('name'),
            default    => $query->orderBy('position')->orderBy('name'),
        };

        // Return all by default (only 13); paginate if requested
        if ($request->has('per_page')) {
            return TutorResource::collection($query->paginate(min((int)$request->integer('per_page',12),48)));
        }
        return TutorResource::collection($query->get());
    }

    public function show(string $slug) {
        $tutor = Tutor::where('slug', $slug)->published()->firstOrFail();

        return (new TutorResource($tutor))->additional([
            'route'        => 'api.tutors.show',
            'availability' => self::weeklyAvailability($tutor),
        ]);
    }

    /**
     * When this teacher actually teaches, as a week of ranges (A2).
     *
     * Read from the STRUCTURED slots the home-tuition intake already captures
     * (teaching_availability_slots: weekday + start + end), not from
     * teacher_profiles.availability, which is the older free-text shape — the
     * AvailabilityGrid that replaced it says why: "5-8pm weekdays" cannot be
     * intersected with anything. Publishing the vague version would put words
     * on a public page that no booking flow can honour.
     *
     * A teacher who has not set slots gets an empty array and the section is
     * hidden, rather than a reassuring but invented timetable. Deliberately
     * ignores date-specific exceptions (holidays): those change weekly and a
     * public page cached anywhere would advertise stale absences.
     */
    public static function weeklyAvailability(Tutor $tutor): array
    {
        $profile = $tutor->user_id
            ? \App\Models\PhysicalTeachingProfile::with('slots')
                ->where('user_id', $tutor->user_id)
                ->where('status', 'active')
                ->first()
            : null;

        if (! $profile) {
            return [];
        }

        // A declared break, or a start date still in the future, means "not
        // now" — and the teacher's dashboard promises exactly that: the field
        // is labelled "On a break until" with the hint "we'll pause your
        // matches". Nothing derives `status` from these dates (pausing is a
        // separate button), so status stays 'active' throughout a holiday and
        // the filter above lets it through. Publishing the week anyway breaks
        // the promise to the teacher and sends a parent to someone who is away.
        //
        // Distinct from the date-specific exceptions excluded above: those are
        // a separate table of one-off holidays that change weekly. These are
        // two stable columns on the row already loaded.
        $today = now()->startOfDay();
        // gte: "on a break until 1 Oct" reads as including that day.
        if ($profile->on_break_until && $profile->on_break_until->gte($today)) {
            return [];
        }
        if ($profile->available_from && $profile->available_from->gt($today)) {
            return [];
        }

        return $profile->slots
            ->groupBy('weekday')
            ->map(fn ($slots, $weekday) => [
                'weekday' => (int) $weekday,
                'day'     => \App\Models\EnrollmentSchedule::DAYS[(int) $weekday] ?? '',
                // The model's own accessors — they already handle MySQL
                // returning "17:00:00" where sqlite returns what we stored.
                'ranges'  => $slots->map(fn ($s) => ['from' => $s->start, 'to' => $s->end])->values()->all(),
            ])
            ->sortKeys()
            ->values()
            ->all();
    }

    /**
     * The shortlist a family sees while booking a demo (B1 in
     * docs/ECOSYSTEM-PLAN.md): teachers who fit what they typed, best first.
     *
     * Same fit scoring the Staff Console uses, plus the Stage 3 ranking — so
     * the order a parent sees and the order a coordinator sees come from one
     * implementation and cannot drift apart.
     *
     * WHAT A VISITOR IS NOT TOLD. Conversion rate, demo counts and the ranking
     * score are management numbers; publishing them would turn a teacher's
     * quiet month into a public scarlet letter and invite gaming. The parent
     * sees the things that actually help them choose — subjects, experience,
     * fee, city, and the star rating real families left after a real demo.
     */
    public function suggestions(Request $request) {
        $data = $request->validate([
            'subject' => 'nullable|string|max:120',
            'grade'   => 'nullable|string|max:40',
            'city'    => 'nullable|string|max:80',
            'mode'    => 'nullable|in:online,home',
        ]);

        $rows = TutorMatcher::rank(
            Tutor::published()->get(),
            $data['subject'] ?? null,
            $data['grade'] ?? null,
            $data['city'] ?? null,
            ($data['mode'] ?? null) === 'home',
        )->take(6);

        $perf = TeacherPerformance::forTutors($rows->pluck('tutor.id')->all());

        return response()->json([
            'data' => $rows->map(function ($r) use ($perf) {
                $t = $r['tutor'];
                $p = $perf[$t->id] ?? [];
                return [
                    'id'               => $t->id,
                    'name'             => $t->name,
                    'slug'             => $t->slug,
                    'image_url'        => $t->image_url,
                    'tagline'          => $t->tagline,
                    'qualification'    => $t->qualification,
                    'subjects'         => $t->subjects_list,
                    'city'             => $t->city,
                    'teaching_mode'    => $t->teaching_mode,
                    'experience_years' => $t->experience_years,
                    'fee_hourly'       => $t->fee_hourly,
                    'verified'         => (bool) $t->verified,
                    'why'              => $r['why'],
                    // Public-safe slice only. No score, no conversion, no demo counts.
                    'review_avg'       => $p['review_avg'] ?? null,
                    'review_count'     => $p['review_count'] ?? 0,
                ];
            })->values()->all(),
            'meta' => ['count' => $rows->count()],
        ]);
    }

    /** Distinct subjects + cities for building filter dropdowns */
    public function filters() {
        $tutors = Tutor::published()->get(['subjects','city']);
        $subjects = [];
        foreach ($tutors as $t) {
            foreach (explode(',', $t->subjects ?? '') as $s) {
                $s = trim($s);
                if ($s !== '') $subjects[$s] = true;
            }
        }
        ksort($subjects);
        $cities = $tutors->pluck('city')->filter()->unique()->sort()->values();
        return response()->json([
            'subjects' => array_keys($subjects),
            'cities'   => $cities,
        ]);
    }
}
