<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDemoRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'               => ['required', 'string', 'max:120'],
            'email'              => ['required', 'email', 'max:180'],
            'phone_country_code' => ['nullable', 'string', 'max:6'],
            'phone'              => ['required', 'string', 'max:20'],
            'subject'            => ['nullable', 'string', 'max:120'],
            'grade'              => ['nullable', 'string', 'max:40'],
            'board'              => ['nullable', 'string', 'max:20'],
            'mode'                => ['nullable', 'in:online,home'],
            'city'               => ['nullable', 'string', 'max:80'],
            'country'            => ['nullable', 'string', 'max:80'],
            'timezone'           => ['nullable', 'string', 'max:60'],
            'message'            => ['nullable', 'string', 'max:2000'],
            'whatsapp_consent'   => ['nullable', 'boolean'],
            'marketing_consent'  => ['nullable', 'boolean'],
            'course_id'          => ['nullable', 'integer', 'exists:courses,id'],
        ];
    }
}
