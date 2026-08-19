<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    // Checkout payments. Leave the keys empty to keep the pending-payment
    // stub flow; setting both activates the Razorpay modal at checkout.
    'razorpay' => [
        'key'    => env('RAZORPAY_KEY_ID'),
        'secret' => env('RAZORPAY_KEY_SECRET'),
    ],

    // Bunny.net Stream — paid video-course playback. Set the library id +
    // token security key to sign gated playback URLs; without them, only
    // preview (YouTube) lessons play. embed_host defaults to Bunny's iframe CDN.
    'bunny' => [
        'library_id' => env('BUNNY_STREAM_LIBRARY_ID'),
        'token_key'  => env('BUNNY_STREAM_TOKEN_KEY'),
        'embed_host' => env('BUNNY_STREAM_EMBED_HOST', 'iframe.mediadelivery.net'),
    ],

    // Cloudflare R2 — self-hosted course video on a private bucket, played via
    // short-lived presigned URLs. Egress is never billed, so the "lifetime
    // access / unlimited rewatch" promise costs nothing to keep; only stored
    // bytes bill (first 10 GB free). Empty = R2 lessons stay locked.
    'r2' => [
        'account_id' => env('R2_ACCOUNT_ID'),
        'bucket'     => env('R2_BUCKET'),
        'access_key' => env('R2_ACCESS_KEY_ID'),
        'secret_key' => env('R2_SECRET_ACCESS_KEY'),
        // Optional: override the S3 endpoint (custom domain, Backblaze B2, or a
        // local static server for testing). Empty = R2's own endpoint.
        'endpoint'   => env('R2_ENDPOINT'),
    ],

    // Course study assistant (lesson summaries + Q&A for buyers). Gemini by
    // default — its free tier costs nothing at current traffic. Swapping
    // providers is a config change plus one branch in AppSupportCourseAi.
    // Empty key = the assistant is hidden everywhere.
    'ai' => [
        'provider' => env('AI_PROVIDER', 'gemini'),
        'key'      => env('AI_API_KEY', env('GEMINI_API_KEY')),
        // The `-latest` alias on purpose, not a pinned version. Google moves
        // free-tier quota between model versions — on 2026-08-10 the pinned
        // gemini-2.0-flash returned 429 `limit: 0` (zero free quota, not
        // overuse) while gemini-flash-latest answered fine on the same key.
        // The alias follows wherever the free quota goes; a pin dies with it.
        'model'    => env('AI_MODEL', 'gemini-flash-latest'),

        // Image generation is a SEPARATE model and a separate quota. On the
        // free tier it returns 429 with "limit: 0" — not overuse, but no free
        // allowance at all — so cover-image generation only starts working
        // once billing is enabled on the Google account. Text drafting works
        // on the free tier today. Kept configurable so the model can be moved
        // without a deploy of new code.
        'image_model' => env('AI_IMAGE_MODEL', 'gemini-2.5-flash-image'),
    ],

    // Social feeds on the course page. YouTube needs no credentials — the
    // channel /videos page is fetched + parsed server-side (cached) so the
    // top-viewed videos update automatically. Instagram posts require a
    // Graph API access token from the account owner; without it the frontend
    // shows branded placeholder tiles linking to the profile.
    'youtube' => [
        'channel_url' => env('YOUTUBE_CHANNEL_URL', 'https://www.youtube.com/@IndiantutorsOnline/videos'),
    ],
    'instagram' => [
        'token' => env('INSTAGRAM_ACCESS_TOKEN'),
    ],

    // Pincode -> district / state autofill for the physical-tuition address
    // forms. The bundled `pincodes` table answers first; this switch controls
    // whether an unknown pincode may fall through to India Post's open
    // endpoint (no key, no quota published). Turn it off to stay offline.
    'pincode' => [
        'lookup_api' => (bool) env('PINCODE_LOOKUP_API', true),
    ],

    // The external teacher-assignment app reads /api/matching/v1/* with this
    // key in an X-Matching-Key header. Unset = the whole export refuses to
    // answer; it is never open by default.
    'matching' => [
        'key' => env('MATCHING_API_KEY'),
    ],

    // The IndiaTutors LMS (leads console, its own Hostinger slot). New
    // enquiries are pushed to its POST /api/leads/intake so staff work them
    // there instead of in seven write-only tables. Base URL unset = the push
    // is off and enquiries are stored locally only — the site must never
    // depend on the LMS being up. One env edit per side moves either domain.
    'lms' => [
        // OFF unless switched on deliberately. The owner retired that LMS on
        // 10 Aug 2026 ("the previous LMS we made and connected will not be in
        // use"), but the push was gated on the URL and token alone — so any
        // host where those were once set kept delivering every demo booking,
        // contact ticket and home-tuition requirement to a system nobody
        // watches, and LmsLeadPush stamped each one with an lms_lead_no that
        // makes it look already handled. A leftover env var should not be able
        // to route leads into a dead system; requiring this flag means the
        // adapter stays ready for the new LMS without firing by accident.
        'enabled'      => env('LMS_ENABLED', false),
        'base_url'     => env('LMS_BASE_URL', ''),
        'intake_token' => env('LMS_INTAKE_TOKEN', ''),
        'brand'        => env('LMS_BRAND', 'indiatutors-online'),
    ],

];
