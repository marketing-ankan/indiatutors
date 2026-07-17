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

];
