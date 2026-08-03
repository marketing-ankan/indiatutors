<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AuditLogResource;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class AdminAuditController extends Controller
{
    public function index(Request $request)
    {
        $q = AuditLog::query()->latest();

        if ($type = $request->string('type')->toString()) $q->where('object_type', $type);
        if ($s = trim($request->string('q')->toString())) {
            $q->where(fn ($w) => $w
                ->where('actor_label', 'like', "%{$s}%")
                ->orWhere('action', 'like', "%{$s}%")
                ->orWhere('object_label', 'like', "%{$s}%"));
        }

        return AuditLogResource::collection($q->paginate(30));
    }
}
