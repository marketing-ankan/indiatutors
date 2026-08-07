<?php

namespace App\Support;

use App\Models\DemoRequest;
use App\Models\SupportTicket;
use App\Models\TuitionRequirement;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

/**
 * Pushes new enquiries into the IndiaTutors LMS (POST /api/leads/intake) so
 * staff work them in one console instead of three write-only tables.
 *
 * DESIGN RULES, each earned:
 *
 * - Fail dark. services.lms.base_url unset = off. The LMS being down, slow or
 *   wrong must never cost a customer their form submit, so every entry point
 *   swallows Throwable and the HTTP timeout is short. The enquiry is already
 *   saved locally before this is called — the push is a copy, not the record.
 *
 * - Synchronous, after the save. This host's database queue has no worker and
 *   can never host one (cron-only shared hosting), so a dispatch() would rot
 *   in the jobs table forever. An inline call bounded at ~3s is the only
 *   delivery that actually happens here.
 *
 * - The intake endpoint has NO validation: a misspelled key is dropped
 *   silently and the call still answers 200. Every field name in the payload
 *   arrays below was verified against LeadIntakeController's reads — do not
 *   rename one without re-checking that file.
 *
 * - Names are never split. The LMS does trim(first.' '.last), so the whole
 *   site name goes in *_first_name and the last-name key is omitted —
 *   lossless in both directions.
 *
 * - lead_code and stu_id are NEVER sent: an accidental match against an
 *   existing LMS lead silently RESTORES that lead instead of creating ours.
 *
 * - Idempotency is ours to provide. The LMS stores external_ref but never
 *   checks it; its duplicate guard only engages when a subject name resolves.
 *   The returned lead_no is persisted on the source row (when the column
 *   exists) and a row that has one is never pushed again.
 */
class LmsLeadPush
{
    /**
     * Site subject names that would prefix-match the wrong LMS subject, or
     * none at all. The LMS matcher is exact-then-prefix: the site's bare
     * "Carnatic" (a Vocal Music child) would prefix-hit "Carnatic Violin"
     * before its intended vocal meaning.
     */
    private const SUBJECT_MAP = [
        'Carnatic'   => 'Carnatic Vocal',
        'Hindustani' => 'Hindustani Vocal',
        'Western'    => 'Western Vocal',
    ];

    public static function enabled(): bool
    {
        return config('services.lms.base_url') !== ''
            && config('services.lms.intake_token') !== '';
    }

    /* ---------------------------------------------------------------------
     * Entry points — one per capture point. All best-effort, all void.
     * ------------------------------------------------------------------- */

    public static function tuitionRequirement(TuitionRequirement $r): void
    {
        try {
            if (! self::enabled() || $r->lms_lead_no ?? null) {
                return;
            }

            $self = ($r->relationship ?? null) === 'self';

            $payload = [
                'parent_first_name'  => $self ? '' : (string) $r->contact_name,
                'student_first_name' => $self ? (string) $r->contact_name : (string) ($r->learner_name ?? ''),
                'whatsapp_number'    => self::phone($r->contact_phone),
                'email'              => (string) ($r->contact_email ?? ''),
                'country'            => (string) ($r->country ?: 'India'),
                // True by definition — home tuition is in-person in India —
                // and it spares fresh LMS installs whose student_timezone
                // column predates the nullable fix.
                'time_zone'          => 'Asia/Kolkata',
                'grade'              => GradeScale::label($r->grade),
                'age'                => self::ageFrom($r->learner_dob),
                'subjects'           => self::subjects((array) ($r->subjects ?? [])),
                'source_channel'     => 'website_tuition',
                'source'             => 'Website Tuition Requirement',
                'brand'              => (string) config('services.lms.brand'),
                'external_ref'       => (string) $r->code,
                'requirement'        => self::blob([
                    'Type'            => 'Physical home tuition',
                    'Relationship'    => $r->relationship,
                    'Best time'       => $r->best_time_to_call,
                    'WhatsApp consent' => $r->whatsapp_consent ? 'yes' : null,
                    'Learner'         => trim(($r->learner_name ?? '') . ' ' . ($r->learner_gender ? "({$r->learner_gender})" : '')),
                    'Learners'        => $r->learner_count > 1 ? $r->learner_count : null,
                    'Board / school'  => trim(($r->board ?? '') . ' ' . ($r->school ? "— {$r->school}" : '')),
                    'Medium'          => $r->medium,
                    'Goal'            => $r->goal,
                    'Exam target'     => $r->exam_target,
                    'Special needs'   => $r->special_needs ? ($r->special_needs_note ?: 'yes') : null,
                    'Address'         => self::address($r),
                    'Pincode'         => $r->pincode,
                    'Venue'           => $r->venue_preference,
                    'Schedule'        => self::schedule($r),
                    'Urgency'         => $r->urgency,
                    'Budget'          => self::budget($r),
                    'Teacher prefs'   => self::teacherPrefs($r),
                    'Subjects (raw)'  => implode(' | ', (array) ($r->subjects ?? [])),
                    'Notes'           => $r->notes,
                ]),
            ];

            self::send($payload, $r, 'tuition ' . $r->code);
        } catch (\Throwable $e) {
            Log::warning('LmsLeadPush tuition failed: ' . $e->getMessage());
        }
    }

    public static function demoRequest(DemoRequest $d, ?string $courseName = null): void
    {
        try {
            if (! self::enabled() || $d->lms_lead_no ?? null) {
                return;
            }

            $payload = [
                'parent_first_name' => (string) $d->name,
                'whatsapp_number'   => self::phone($d->phone, $d->phone_country_code),
                'email'             => (string) $d->email,
                'country'           => (string) ($d->country ?? ''),
                // The LMS key is time_zone; the site column is timezone. This
                // rename is load-bearing — the wrong key is silently dropped.
                'time_zone'         => (string) ($d->timezone ?? ''),
                'grade'             => (string) ($d->grade ?? ''),
                'subjects'          => self::subjects(array_filter([(string) ($d->subject ?? '')])),
                'source_channel'    => 'website_form',
                'brand'             => (string) config('services.lms.brand'),
                'external_ref'      => 'DEMO-' . $d->id,
                'requirement'       => self::blob([
                    'Type'    => 'Demo booking — ' . ($d->type ?? 'demo'),
                    'Mode'    => $d->mode,
                    'Board'   => $d->board,
                    'City'    => $d->city,
                    'Course'  => $courseName,
                    'Message' => $d->message,
                ]),
            ];

            self::send($payload, $d, 'demo DEMO-' . $d->id);
        } catch (\Throwable $e) {
            Log::warning('LmsLeadPush demo failed: ' . $e->getMessage());
        }
    }

    public static function contactTicket(SupportTicket $t): void
    {
        try {
            if (! self::enabled() || $t->lms_lead_no ?? null) {
                return;
            }
            // Newsletter signups carry a hardcoded name and no phone; pushing
            // one would mint an LMS parent (and a live users login) for
            // "Newsletter subscriber". Uncontactable rows are junk leads.
            if (($t->subject ?? '') === 'Newsletter signup') {
                return;
            }
            // Column names are name/email/phone on support_tickets — NOT
            // contact_*. Getting this wrong is invisible: the push would send
            // empty strings and this guard would drop every ticket.
            if (blank($t->phone ?? null) && blank($t->email ?? null)) {
                return;
            }

            $subject = (string) ($t->subject ?? '');
            $source  = match (true) {
                str_starts_with($subject, 'Tutor enquiry:')        => 'Website Tutor Enquiry',
                str_starts_with($subject, 'Curriculum download:')  => 'Website Curriculum Download',
                $subject === 'Full pricing PDF request'            => 'Website Pricing Request',
                str_starts_with($subject, 'Referral')              => 'Website Referral',
                default                                            => 'Website Contact',
            };

            $payload = [
                'parent_first_name' => (string) $t->name,
                'whatsapp_number'   => self::phone($t->phone),
                'email'             => (string) ($t->email ?? ''),
                'time_zone'         => 'Asia/Kolkata',
                'source_channel'    => 'website_contact',
                'source'            => $source,
                'brand'             => (string) config('services.lms.brand'),
                'external_ref'      => (string) $t->code,
                'requirement'       => self::blob([
                    'Subject' => $subject,
                    'Message' => optional($t->messages()->oldest()->first())->body,
                ]),
            ];

            self::send($payload, $t, 'contact ' . $t->code);
        } catch (\Throwable $e) {
            Log::warning('LmsLeadPush contact failed: ' . $e->getMessage());
        }
    }

    /* ---------------------------------------------------------------------
     * The wire call
     * ------------------------------------------------------------------- */

    private static function send(array $payload, $model, string $label): void
    {
        $base = rtrim((string) config('services.lms.base_url'), '/');

        $res = Http::withToken((string) config('services.lms.intake_token'))
            ->acceptJson()
            ->connectTimeout(2)
            ->timeout(3)
            ->post($base . '/api/leads/intake', $payload);

        if ($res->successful() && $res->json('ok')) {
            $leadNo = (string) ($res->json('lead_no') ?? '');
            Log::info("LmsLeadPush: {$label} -> {$leadNo}" . ($res->json('duplicate') ? ' (duplicate)' : ''));
            // Idempotency marker — but only when the column has arrived. The
            // deploy's DB step can lag the code by a cycle on this host, and
            // a missing column must not turn a delivered lead into an error.
            if ($leadNo !== '' && Schema::hasColumn($model->getTable(), 'lms_lead_no')) {
                $model->forceFill(['lms_lead_no' => $leadNo])->saveQuietly();
            }
            return;
        }

        // 401 = token mismatch, 503 = LMS kill-switch; both are config states
        // someone must notice, not transient noise.
        Log::warning("LmsLeadPush: {$label} refused — HTTP {$res->status()} " . mb_substr((string) $res->body(), 0, 200));
    }

    /* ---------------------------------------------------------------------
     * Transforms
     * ------------------------------------------------------------------- */

    /** E.164-ish: merge a country code, default bare 10-digit Indian numbers to +91. */
    private static function phone(?string $raw, ?string $countryCode = null): string
    {
        $digits = preg_replace('/\D+/', '', (string) $raw);
        if ($digits === '') {
            return '';
        }
        $cc = preg_replace('/\D+/', '', (string) $countryCode);
        if ($cc !== '' && ! str_starts_with($digits, $cc)) {
            return '+' . $cc . $digits;
        }
        if (strlen($digits) === 10) {
            return '+91' . $digits;
        }
        return '+' . $digits;
    }

    /**
     * Site subject list -> the comma-separated names string the LMS explodes.
     * Commas inside a name would mis-split on the far side, so they become
     * spaces; ambiguous names are pre-mapped (see SUBJECT_MAP).
     */
    private static function subjects(array $names): string
    {
        return collect($names)
            ->map(fn ($s) => trim(str_replace(',', ' ', (string) $s)))
            ->filter()
            ->map(fn ($s) => self::SUBJECT_MAP[$s] ?? $s)
            ->unique()
            ->implode(', ');
    }

    private static function ageFrom($dob): ?string
    {
        if (! $dob) {
            return null;
        }
        try {
            $years = \Carbon\Carbon::parse($dob)->age;
            return $years > 0 && $years < 100 ? (string) $years : null;
        } catch (\Throwable) {
            return null;
        }
    }

    /** Labelled multi-line blob; empty values vanish so staff read only facts. */
    private static function blob(array $lines): string
    {
        return collect($lines)
            ->filter(fn ($v) => ! blank($v))
            ->map(fn ($v, $k) => "{$k}: {$v}")
            ->implode("\n");
    }

    private static function address(TuitionRequirement $r): ?string
    {
        $parts = array_filter([
            $r->address_line1, $r->address_line2, $r->landmark, $r->locality,
            $r->city, $r->district, $r->state,
        ]);
        return $parts ? implode(', ', $parts) : null;
    }

    private static function schedule(TuitionRequirement $r): ?string
    {
        $bits = array_filter([
            $r->preferred_days ? 'days ' . implode('/', (array) $r->preferred_days) : null,
            $r->preferred_time_windows ? 'times ' . implode('/', (array) $r->preferred_time_windows) : null,
            $r->sessions_per_week ? "{$r->sessions_per_week}x per week" : null,
            $r->session_minutes ? "{$r->session_minutes} min" : null,
            $r->start_date ? "from {$r->start_date}" : null,
        ]);
        return $bits ? implode(', ', $bits) : null;
    }

    private static function budget(TuitionRequirement $r): ?string
    {
        if ($r->budget_monthly) {
            return "₹{$r->budget_monthly}/month";
        }
        if ($r->budget_min_hourly || $r->budget_max_hourly) {
            return '₹' . ($r->budget_min_hourly ?? '?') . '–' . ($r->budget_max_hourly ?? '?') . '/hour';
        }
        return null;
    }

    private static function teacherPrefs(TuitionRequirement $r): ?string
    {
        $bits = array_filter([
            $r->preferred_teacher_gender ? "gender {$r->preferred_teacher_gender}" : null,
            $r->preferred_teacher_languages ? 'languages ' . implode('/', (array) $r->preferred_teacher_languages) : null,
            $r->min_teacher_experience ? "{$r->min_teacher_experience}+ yrs" : null,
            $r->group_ok ? 'group OK' : null,
        ]);
        return $bits ? implode(', ', $bits) : null;
    }
}
