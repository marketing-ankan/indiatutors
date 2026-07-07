<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreContactRequest;
use App\Models\ContactMessage;

class ContactController extends Controller
{
    public function store(StoreContactRequest $request)
    {
        $msg = ContactMessage::create($request->validated() + ['status' => 'new']);
        return response()->json(['message' => 'Thanks — we\'ll be in touch soon.', 'id' => $msg->id], 201);
    }
}
