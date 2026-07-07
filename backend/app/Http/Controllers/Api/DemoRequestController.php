<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDemoRequestRequest;
use App\Models\DemoRequest;

class DemoRequestController extends Controller
{
    public function store(StoreDemoRequestRequest $request)
    {
        $demo = DemoRequest::create($request->validated() + ['status' => 'new']);

        // TODO Phase 2: fire notification to admin + WhatsApp reply to student
        return response()->json([
            'message' => 'Demo request received. Our team will contact you within 24 hours.',
            'id'      => $demo->id,
        ], 201);
    }
}
