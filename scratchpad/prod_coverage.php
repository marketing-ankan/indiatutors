<?php
/**
 * Demo-suggestion coverage measured against the LIVE roster.
 *
 * The local preview database carries a fixture tutor who does not exist on
 * production (Anita Rao, who teaches Mathematics), so measuring locally
 * overstated coverage and hid the fact that Maths has nobody. This rebuilds
 * the 13 real published tutors and the 110 real courses in a throwaway
 * database and runs the actual TutorMatcher over them, so the numbers describe
 * the site families are using rather than this machine.
 */
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Tutor;
use App\Support\TutorMatcher;
use Illuminate\Support\Facades\DB;

$dir = __DIR__;
$tutorsJson  = json_decode(file_get_contents("$dir/prod_tutors.json"), true)['data'];
$coursesJson = json_decode(file_get_contents("$dir/prod_courses.json"), true)['data'];

// Wipe and reload tutors inside a transaction we never commit, so the
// throwaway database this runs against is left exactly as it was found.
DB::beginTransaction();

Tutor::query()->delete();
foreach ($tutorsJson as $t) {
    Tutor::create([
        'id'               => $t['id'],
        'name'             => $t['name'],
        'slug'             => $t['slug'],
        'subjects'         => implode(', ', $t['subjects'] ?? []),
        'grades'           => implode(', ', $t['grades'] ?? []),
        'city'             => $t['city'] ?? null,
        'teaching_mode'    => $t['teaching_mode'] ?? 'online',
        'experience_years' => $t['experience_years'],
        'verified'         => (bool) ($t['verified'] ?? false),
        'is_published'     => true,
    ]);
}

$tutors = Tutor::where('is_published', true)->get();
fwrite(STDERR, 'live tutors loaded: ' . $tutors->count() . "\n");

$rows = [];
foreach ($coursesJson as $c) {
    $name = $c['name'] ?? '';
    if ($name === '') continue;

    // Exactly what a course page sends: /book-demo?subject=<course name>,
    // online mode, no grade or city until the family types them.
    $out = TutorMatcher::rank($tutors, $name, null, null, false);

    $rows[] = [
        'name'     => $name,
        'slug'     => $c['slug'] ?? '',
        'matches'  => $out->count(),
        'who'      => $out->take(3)->map(fn ($r) => $r['tutor']->name)->implode(', '),
        'price'    => $c['sale_price'] ?? $c['regular_price'] ?? null,
        'regular'  => $c['regular_price'] ?? null,
    ];
}

DB::rollBack();

$miss = array_values(array_filter($rows, fn ($r) => $r['matches'] === 0));
$hit  = array_values(array_filter($rows, fn ($r) => $r['matches'] > 0));

usort($miss, fn ($a, $b) => strcasecmp($a['name'], $b['name']));

printf("LIVE coverage: %d courses, %d with a teacher, %d with nobody\n\n",
    count($rows), count($hit), count($miss));

file_put_contents("$dir/uncovered.json", json_encode($miss, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
file_put_contents("$dir/covered.json",   json_encode($hit,  JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

foreach ($miss as $m) echo "  - {$m['name']}\n";
