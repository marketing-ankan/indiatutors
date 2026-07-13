<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    @if($gaId = config('app.ga_id'))
    <script async src="https://www.googletagmanager.com/gtag/js?id={{ $gaId }}"></script>
    <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','{{ $gaId }}');</script>
    @endif
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Poppins:wght@500;600;700;800&display=swap" rel="stylesheet" />

    @php($m = $meta ?? [])
    <title>{{ $m['title'] ?? 'Indiatutors Online — Live Online Tutoring & Verified Home Tutors Across India' }}</title>
    <meta name="description" content="{{ $m['description'] ?? 'Live 1-on-1 classes, group sessions, and self-paced video courses across Academics, Coding, Music, Dance, Languages & more.' }}" />
    <meta name="robots" content="{{ $m['robots'] ?? 'index, follow' }}" />
    @isset($m['canonical'])<link rel="canonical" href="{{ $m['canonical'] }}" />@endisset

    {{-- Open Graph --}}
    <meta property="og:site_name" content="{{ $m['site_name'] ?? 'Indiatutors Online' }}" />
    <meta property="og:type" content="{{ $m['type'] ?? 'website' }}" />
    <meta property="og:title" content="{{ $m['title'] ?? 'Indiatutors Online' }}" />
    <meta property="og:description" content="{{ $m['description'] ?? '' }}" />
    @isset($m['canonical'])<meta property="og:url" content="{{ $m['canonical'] }}" />@endisset
    @if(!empty($m['image']))<meta property="og:image" content="{{ $m['image'] }}" />@endif

    {{-- Twitter --}}
    <meta name="twitter:card" content="{{ !empty($m['image']) ? 'summary_large_image' : 'summary' }}" />
    <meta name="twitter:title" content="{{ $m['title'] ?? 'Indiatutors Online' }}" />
    <meta name="twitter:description" content="{{ $m['description'] ?? '' }}" />
    @if(!empty($m['image']))<meta name="twitter:image" content="{{ $m['image'] }}" />@endif

    {{-- Structured data (schema.org JSON-LD) --}}
    @foreach(($m['jsonld'] ?? []) as $ld)
    <script type="application/ld+json">{!! json_encode($ld, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) !!}</script>
    @endforeach

    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/main.jsx'])
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
