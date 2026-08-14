<x-mail::message>
# {{ $title }}

@foreach ($lines as $label => $value)
@if (filled($value))
**{{ $label }}:** {{ $value }}
@endif
@endforeach

@if ($adminPath)
<x-mail::button :url="rtrim(config('app.url'), '/') . $adminPath">
Open in the Staff Console
</x-mail::button>
@endif

This enquiry is already saved — it is waiting in the console whether or not this
email arrives.

{{ config('app.name') }}
</x-mail::message>
