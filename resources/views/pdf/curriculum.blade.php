{{--
  Curriculum PDF — a designed document, generated server-side by mPDF.

  This is deliberately NOT the website markup. mPDF renders an older CSS subset
  (no flexbox/grid), so layout that needs two things on one line uses tables —
  that is the idiomatic approach here, not a workaround.

  Devanagari (the Hindi and Sanskrit curricula contain conjuncts such as क्ष and
  matras) is shaped by mPDF's Indic engine; the controller enables
  autoScriptToLang/autoLangToFont so the font switches per script automatically.
--}}
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<style>
  @page {
    header: html_hdr;
    footer: html_ftr;
    margin: 30mm 16mm 20mm;
  }
  /* The cover carries its own furniture, so it suppresses the running header. */
  @page cover { header: _blank; footer: html_ftr; margin: 0; }

  body {
    font-family: sans-serif;
    font-size: 10.2pt;
    line-height: 1.5;
    color: #24303f;
  }
  h1, h2, h3 { margin: 0; font-weight: bold; }

  /* ---------- Cover ---------- */
  .cover-band {
    background-color: #0B1220;
    color: #ffffff;
    padding: 26mm 18mm 18mm;
  }
  .cover-eyebrow {
    font-size: 8.5pt;
    letter-spacing: 3px;
    color: #D4AF37;
    text-transform: uppercase;
    margin-bottom: 6mm;
  }
  .cover-title  { font-size: 30pt; line-height: 1.1; color: #ffffff; }
  .cover-sub    { font-size: 11.5pt; color: #c7d2e4; margin-top: 5mm; }
  .cover-rule   { height: 2mm; background-color: #D4AF37; width: 34mm; margin-top: 8mm; }

  .cover-body { padding: 14mm 18mm 0; }
  .factbox {
    width: 100%;
    border-collapse: collapse;
    margin-top: 2mm;
  }
  .factbox td {
    width: 25%;
    border: 0.4mm solid #e2e8f0;
    padding: 5mm 4mm;
    text-align: center;
  }
  .fact-n     { font-size: 17pt; font-weight: bold; color: #1E40AF; }
  .fact-l     { font-size: 8pt; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }
  .cover-note { font-size: 9.5pt; color: #475569; margin-top: 12mm; }
  .cover-foot { font-size: 9pt; color: #475569; margin-top: 4mm; }

  /* ---------- Running header / footer ---------- */
  .hdr {
    width: 100%;
    border-bottom: 0.3mm solid #cbd5e1;
    padding-bottom: 2mm;
    font-size: 8.5pt;
    color: #64748b;
  }
  .hdr .r { text-align: right; }
  .ftr {
    width: 100%;
    border-top: 0.3mm solid #cbd5e1;
    padding-top: 2mm;
    font-size: 8pt;
    color: #64748b;
  }
  .ftr .r { text-align: right; }

  /* ---------- Levels ---------- */
  /* A level is an atom: mPDF keeps it whole rather than stranding its heading
     at the foot of a page — the defect that made the old print output look
     like screenshots. */
  .level { page-break-inside: avoid; margin-bottom: 8mm; }

  .level-head { width: 100%; border-collapse: collapse; margin-bottom: 3mm; }
  .level-head td { vertical-align: middle; padding: 0 0 2mm; border-bottom: 0.5mm solid #1E40AF; }
  .lv-no {
    width: 9mm;
    font-size: 12pt;
    font-weight: bold;
    color: #ffffff;
    background-color: #1E40AF;
    text-align: center;
    padding: 1mm 0;
    border-bottom: 0 !important;
  }
  .lv-no-cell { width: 11mm; }
  .lv-title { font-size: 12.5pt; font-weight: bold; color: #0B1220; }
  .lv-meta  { text-align: right; font-size: 8.5pt; color: #64748b; white-space: nowrap; }

  .topics { width: 100%; border-collapse: collapse; }
  .topics td { padding: 0 0 2.2mm; vertical-align: top; }
  .topics .bullet { width: 5mm; color: #1E40AF; font-weight: bold; }

  .endnote {
    margin-top: 6mm;
    padding-top: 3mm;
    border-top: 0.3mm solid #cbd5e1;
    font-size: 8.5pt;
    color: #475569;
  }
</style>
</head>
<body>

{{-- Running header: suppressed on the cover via @page cover --}}
<htmlpageheader name="hdr">
  <table class="hdr"><tr>
    <td>{{ $course->name }} — Curriculum</td>
    <td class="r">Indiatutors Online</td>
  </tr></table>
</htmlpageheader>

<htmlpagefooter name="ftr">
  <table class="ftr"><tr>
    <td>indiatutorsonline.com &nbsp;·&nbsp; +91 93308 11581</td>
    <td class="r">Page {PAGENO} of {nbpg}</td>
  </tr></table>
</htmlpagefooter>

{{-- ---------------- COVER ---------------- --}}
<div class="cover-band">
  <div class="cover-eyebrow">Indiatutors Online</div>
  <h1 class="cover-title">{{ $course->name }}</h1>
  @if ($course->subtitle)
    <div class="cover-sub">{{ $course->subtitle }}</div>
  @endif
  <div class="cover-rule"></div>
</div>

<div class="cover-body">
  <table class="factbox"><tr>
    <td><div class="fact-n">{{ $levelCount }}</div><div class="fact-l">Levels</div></td>
    <td><div class="fact-n">{{ $topicCount }}</div><div class="fact-l">Topics</div></td>
    @if ($totalHours)
      <td><div class="fact-n">{{ $totalHours }}</div><div class="fact-l">Hours</div></td>
    @endif
    <td><div class="fact-n">1:1</div><div class="fact-l">Live classes</div></td>
  </tr></table>

  <div class="cover-note">
    This is the complete, level-by-level curriculum for <strong>{{ $course->name }}</strong>.
    Every course is taught live by a verified tutor, and the exact pace and starting
    level are personalised after your free demo class.
  </div>
  <div class="cover-foot">
    Prepared {{ $date }} &nbsp;·&nbsp; connect@indiatutorsonline.com
  </div>
</div>

<pagebreak page-selector="_default" />

{{-- ---------------- CURRICULUM ---------------- --}}
@foreach ($levels as $i => $level)
  <div class="level">
    <table class="level-head"><tr>
      <td class="lv-no-cell"><div class="lv-no">{{ $i + 1 }}</div></td>
      <td class="lv-title">{{ $level['title'] ?? '' }}</td>
      <td class="lv-meta">
        {{ $level['age'] ?? '' }}@if (!empty($level['age']) && !empty($level['duration'])) &nbsp;·&nbsp; @endif{{ $level['duration'] ?? '' }}
      </td>
    </tr></table>

    @if (!empty($level['topics']))
      <table class="topics">
        @foreach ($level['topics'] as $topic)
          <tr>
            <td class="bullet">&bull;</td>
            <td>{{ $topic }}</td>
          </tr>
        @endforeach
      </table>
    @endif
  </div>
@endforeach

<div class="endnote">
  <strong>Next step —</strong> book a free demo class at indiatutorsonline.com/book-demo and we will
  map this curriculum to your child's current level. No payment and no commitment for the first class.
</div>

</body>
</html>
