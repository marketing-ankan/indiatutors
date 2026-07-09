<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Http\Resources\TutorResource;
use App\Models\Tutor;
use Illuminate\Support\Str;

class CityController extends Controller {
    /** List cities we have tutors in (for local-SEO landing links). */
    public function index() {
        $cities = Tutor::published()->get(['city'])
            ->pluck('city')->filter()->unique()->sort()->values()
            ->map(fn ($c) => [
                'name'        => $c,
                'slug'        => Str::slug($c),
                'tutor_count' => Tutor::published()->where('city', $c)->count(),
            ]);
        return response()->json(['data' => $cities]);
    }

    /** One city landing page: tutors + aggregated subjects/localities. */
    public function show(string $slug) {
        $tutors = Tutor::published()->orderBy('position')->orderBy('name')->get();
        $city = $tutors->first(fn ($t) => Str::slug((string) $t->city) === $slug)?->city;
        abort_if($city === null, 404);

        $inCity     = $tutors->filter(fn ($t) => $t->city === $city)->values();
        $localities = $inCity->flatMap->localities_list->unique()->sort()->values();
        $subjects   = $inCity->flatMap->subjects_list->unique()->sort()->values();

        return response()->json([
            'name'        => $city,
            'slug'        => $slug,
            'state'       => $inCity->first()->state,
            'tutor_count' => $inCity->count(),
            'localities'  => $localities,
            'subjects'    => $subjects,
            'tutors'      => TutorResource::collection($inCity),
        ]);
    }
}
