<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller {
    public function register(Request $request) {
        $data = $request->validate([
            'name'     => 'required|string|max:120',
            'email'    => 'required|email|max:180|unique:users,email',
            'password' => 'required|string|min:8',
            'role'     => 'nullable|in:parent,teacher',
            'phone'    => 'nullable|string|max:20',
        ]);

        $user = User::create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'password' => $data['password'],       // hashed via cast
            'role'     => $data['role'] ?? 'parent',
            'phone'    => $data['phone'] ?? null,
        ]);
        if ($user->isTeacher()) $user->teacherProfile()->create(['status' => 'pending']);

        return response()->json([
            'token' => $user->createToken('spa')->plainTextToken,
            'user'  => new UserResource($user),
        ], 201);
    }

    public function login(Request $request) {
        $data = $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);
        $user = User::where('email', $data['email'])->first();
        if (!$user || !Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages(['email' => ['These credentials do not match our records.']]);
        }
        return response()->json([
            'token' => $user->createToken('spa')->plainTextToken,
            'user'  => new UserResource($user),
        ]);
    }

    public function logout(Request $request) {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out.']);
    }

    public function me(Request $request) {
        return new UserResource(
            $request->user()->loadCount('students')->load('teacherProfile')
        );
    }
}
