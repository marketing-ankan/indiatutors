<?php

namespace App\Http\Controllers;

use App\Models\Course;
use Illuminate\Http\Request;
use Mpdf\Mpdf;

/**
 * Generates the downloadable curriculum as a designed PDF document.
 *
 * Deliberately server-side rather than window.print(): the browser print path
 * cannot produce a cover page, a running header/footer or real "Page 3 of 6"
 * numbering (Chrome does not implement CSS @page margin boxes), and its output
 * varies with each visitor's print dialog and OS. mPDF gives one deterministic
 * file, and — unlike dompdf — shapes the Devanagari in the Hindi and Sanskrit
 * curricula correctly.
 */
class CurriculumPdfController extends Controller
{
    public function show(Request $request, string $slug)
    {
        $course = Course::where('slug', $slug)->where('is_published', true)->firstOrFail();

        $levels = $course->curriculum ?: [];
        abort_if(count($levels) === 0, 404, 'This course has no published curriculum.');

        $html = view('pdf.curriculum', [
            'course'     => $course,
            'levels'     => $levels,
            'levelCount' => count($levels),
            'topicCount' => array_sum(array_map(fn ($l) => count($l['topics'] ?? []), $levels)),
            'totalHours' => array_sum(array_map(fn ($l) => (int) ($l['duration'] ?? 0), $levels)),
            'date'       => now()->timezone('Asia/Kolkata')->format('j F Y'),
        ])->render();

        $tmp = storage_path('app/mpdf');
        if (! is_dir($tmp)) mkdir($tmp, 0775, true);

        // vendor/mpdf ships ~87MB of fonts and scripts/trim-mpdf-fonts.php prunes
        // it to the families this catalogue can reach. If a course ever contains a
        // script outside that set, mPDF throws rather than rendering — so fall back
        // to a plain render (default font, no per-script switching) instead of
        // returning a 500 to a parent who just wanted a download.
        try {
            $pdf = $this->render($html, $course, $tmp, true);
        } catch (\Mpdf\MpdfException $e) {
            report($e);
            $pdf = $this->render($html, $course, $tmp, false);
        }

        $filename = $course->slug.'-curriculum.pdf';

        return response($pdf, 200, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
            'Cache-Control'       => 'private, max-age=0, must-revalidate',
        ]);
    }

    /**
     * @param  bool  $autoFont  Detect the script per text run and switch font
     *                          accordingly — needed for the Devanagari in the
     *                          Hindi and Sanskrit curricula.
     */
    private function render(string $html, Course $course, string $tmp, bool $autoFont): string
    {
        $mpdf = new Mpdf([
            'tempDir'          => $tmp,
            'format'           => 'A4',
            'margin_top'       => 30,
            'margin_bottom'    => 20,
            'margin_left'      => 16,
            'margin_right'     => 16,
            'margin_header'    => 10,
            'margin_footer'    => 10,
            'autoScriptToLang' => $autoFont,
            'autoLangToFont'   => $autoFont,
        ]);

        $mpdf->SetTitle($course->name.' — Curriculum | Indiatutors Online');
        $mpdf->SetAuthor('Indiatutors Online');
        $mpdf->SetCreator('Indiatutors Online');
        $mpdf->WriteHTML($html);

        return $mpdf->Output('', \Mpdf\Output\Destination::STRING_RETURN);
    }
}
