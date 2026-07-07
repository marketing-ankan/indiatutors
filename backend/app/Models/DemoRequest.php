<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DemoRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'email',
        'phone_country_code',
        'phone',
        'subject',
        'grade',
        'board',
        'mode',
        'city',
        'country',
        'timezone',
        'message',
        'whatsapp_consent',
        'marketing_consent',
        'course_id',
        'status',
    ];

    protected $casts = [
        'whatsapp_consent'  => 'boolean',
        'marketing_consent' => 'boolean',
    ];

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }
}
