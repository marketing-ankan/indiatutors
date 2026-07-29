<?php
/**
 * Trim mPDF's bundled font directory down to the families this project can
 * actually reach.
 *
 * Why: vendor/ is committed to git (the Hostinger box has no Composer), and
 * mPDF ships ~87 MB of fonts — most of it CJK, Tibetan, Arabic and historic
 * scripts that this catalogue will never render. Shipping them would bloat the
 * repo and every cron pull.
 *
 * Which families are kept is not guesswork: mPDF's own
 * src/Language/LanguageToFont.php maps each script to a family, and this list
 * covers every language the catalogue teaches —
 *     Latin + Cyrillic (Russian)                       -> dejavusanscondensed
 *     Devanagari (Hindi, Sanskrit), Tamil, Malayalam,
 *     Gujarati, Punjabi, Bengali, Oriya                -> freeserif
 *     Kannada                                          -> lohitkannada
 *     Telugu                                           -> pothana2000
 *
 * Safe because mPDF only opens a .ttf when that family is actually selected,
 * and `useSubstitutions` (the only thing that would pull in backupSubsFont's
 * sun-exta) is off by default and never enabled by this app.
 *
 * Idempotent — runs automatically after composer install/update, and can be run
 * by hand:  php scripts/trim-mpdf-fonts.php
 *
 * If a new language with a different script is ever added to the catalogue, add
 * its family here and re-run; CurriculumPdfController also degrades gracefully
 * rather than 500ing if a font turns out to be missing.
 */

$autoload = __DIR__ . '/../vendor/autoload.php';
if (! is_file($autoload)) { fwrite(STDERR, "trim-mpdf-fonts: vendor/autoload.php missing — skipping.\n"); exit(0); }
require $autoload;

$dir = __DIR__ . '/../vendor/mpdf/mpdf/ttfonts';
if (! is_dir($dir)) { echo "trim-mpdf-fonts: mPDF not installed — nothing to do.\n"; exit(0); }

if (! class_exists(\Mpdf\Config\FontVariables::class)) {
    fwrite(STDERR, "trim-mpdf-fonts: mPDF config class not found — skipping.\n");
    exit(0);
}

$keepFamilies = [
    'dejavusanscondensed',
    'dejavusans', 'dejavuserif', 'dejavuserifcondensed', 'dejavusansmono',
    'freeserif', 'freesans', 'freemono',
    'lohitkannada',
    'pothana2000',
];

$fontdata = (new \Mpdf\Config\FontVariables())->getDefaults()['fontdata'];

$keep = [];
foreach ($keepFamilies as $family) {
    if (! isset($fontdata[$family])) { continue; }
    foreach ($fontdata[$family] as $value) {
        if (is_string($value) && preg_match('/\.ttf$/i', $value)) { $keep[$value] = true; }
    }
}

// Never run with an empty keep-set — that would wipe every font.
if (count($keep) < 10) {
    fwrite(STDERR, "trim-mpdf-fonts: refusing to run, keep-set resolved to only " . count($keep) . " file(s).\n");
    exit(1);
}

$removed = 0;
$freed = 0;
foreach (scandir($dir) as $file) {
    if ($file === '.' || $file === '..' || isset($keep[$file])) { continue; }
    $path = "$dir/$file";
    if (! is_file($path)) { continue; }
    $freed += filesize($path);
    if (@unlink($path)) { $removed++; }
}

if ($removed === 0) {
    echo "trim-mpdf-fonts: already trimmed (" . count($keep) . " fonts kept).\n";
} else {
    printf("trim-mpdf-fonts: removed %d unused font file(s), freed %.1f MB (%d kept).\n",
        $removed, $freed / 1048576, count($keep));
}
