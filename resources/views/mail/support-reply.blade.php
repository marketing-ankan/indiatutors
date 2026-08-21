<x-mail::message>
@if ($recipientName)
Hello {{ $recipientName }},
@endif

Thank you for writing to us. Here is our reply:

{{ $body }}

You can reply to this email and it will reach the same team. Please keep
**{{ $ticketCode }}** in the subject line so we can find your earlier messages.

{{ config('app.name') }}
</x-mail::message>
