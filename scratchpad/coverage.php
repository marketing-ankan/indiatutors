<?php
/**
 * Every course page links to /book-demo?subject=<course title>. So the honest
 * question is not "does the matcher work on tidy input" but "what does a family
 * actually see after clicking Book a demo on each of the 110 real courses".
 */
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Course;
use App\Models\Tutor;
use App\Support\TutorMatcher;

$tutors = Tutor::where('is_published', true)->get();
echo "published tutors: " . $tutors->count() . "\n\n";

$courses = Course::orderBy('name')->get(['name', 'slug']);
$hit = $miss = [];

foreach ($courses as $c) {
    $out = TutorMatcher::rank($tutors, $c->name, null, null, false);
    if ($out->isEmpty()) {
        $miss[] = $c->name;
    } else {
        $hit[$c->name] = $out->take(2)->map(fn ($r) => $r['tutor']->name . '/' . $r['score'])->implode(', ');
    }
}

printf("courses: %d   with a suggestion: %d   with none: %d\n\n", $courses->count(), count($hit), count($miss));

echo "=== FIRST 25 THAT MATCH ===\n";
$n = 0;
foreach ($hit as $t => $who) { printf("  %-46s %s\n", mb_substr($t, 0, 45), $who); if (++$n >= 25) break; }

echo "\n=== ALL WITH NO SUGGESTION (" . count($miss) . ") ===\n";
foreach ($miss as $t) echo "  - $t\n";
