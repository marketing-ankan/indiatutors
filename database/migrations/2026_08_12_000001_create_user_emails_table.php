<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Additional sign-in addresses, LinkedIn-style: you ADD a new address, and only
 * once it is on the account do you remove the old one. Nothing is ever swapped
 * in place, so the account is never momentarily without a working login — which
 * matters here because there is no SMTP to verify a new address with.
 *
 * users.email stays the primary and remains the single authoritative contact
 * address; this table holds the alternates only. Promoting an alternate swaps
 * the two, so the pair can never drift or both claim to be primary.
 *
 * The unique index is what stops two accounts claiming the same address; the
 * controller additionally checks users.email, which this table does not mirror.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('user_emails')) {
            return;
        }
        Schema::create('user_emails', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('email')->unique();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_emails');
    }
};
