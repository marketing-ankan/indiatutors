<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Http\Resources\KycDocumentResource;
use App\Models\KycDocument;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class KycController extends Controller {
    public function index(Request $request) {
        return KycDocumentResource::collection($request->user()->kycDocuments()->latest()->get());
    }

    public function store(Request $request) {
        $data = $request->validate([
            'type' => 'required|in:aadhaar,pan,photo,certificate,other',
            'file' => 'required|file|max:5120|mimes:jpg,jpeg,png,pdf',
        ]);
        // Private storage (storage/app/private/kyc/{user}) — never web-accessible.
        $path = $request->file('file')->store("kyc/{$request->user()->id}", 'local');

        $doc = $request->user()->kycDocuments()->create([
            'type'          => $data['type'],
            'original_name' => $request->file('file')->getClientOriginalName(),
            'path'          => $path,
            'status'        => 'pending',
        ]);
        return (new KycDocumentResource($doc))->response()->setStatusCode(201);
    }

    public function destroy(Request $request, KycDocument $document) {
        abort_unless($document->user_id === $request->user()->id, 403);
        Storage::disk('local')->delete($document->path);
        $document->delete();
        return response()->json(['message' => 'Document removed.']);
    }
}
