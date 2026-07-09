<?php
namespace App\Http\Resources;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class KycDocumentResource extends JsonResource {
    public function toArray(Request $request): array {
        return [
            'id'            => $this->id,
            'type'          => $this->type,
            'original_name' => $this->original_name,
            'status'        => $this->status,
            'uploaded_at'   => optional($this->created_at)->toDateTimeString(),
            // note: file 'path' is intentionally NOT exposed (private storage)
        ];
    }
}
