<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use Illuminate\Http\Request;

class ContactController extends Controller {
    public function store(Request $request) {
        $data = $request->validate([
            'name'    => 'required|string|max:120',
            'email'   => 'required|email|max:180',
            'phone'   => 'nullable|string|max:20',
            'subject' => 'nullable|string|max:200',
            'message' => 'required|string|max:5000',
        ]);
        $msg = ContactMessage::create($data + ['status' => 'new']);
        return response()->json(['message' => "Thanks — we'll be in touch soon.", 'id' => $msg->id], 201);
    }
}
