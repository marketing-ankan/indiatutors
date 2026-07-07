<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Http\Resources\TutorResource;
use App\Models\Tutor;
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
        return (new TutorResource($tutor))->additional(['route' => 'api.tutors.show']);
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
