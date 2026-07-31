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
        'model'    => env('AI_MODEL', 'gemini-2.0-flash'),
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

];
