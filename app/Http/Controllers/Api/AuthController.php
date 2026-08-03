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
            // studentProfile is the profile this account *is* (student role),
            // as opposed to the ones it owns — the student dashboard needs its
            // id to show the right portfolio.
            $request->user()->loadCount('students')->load(['teacherProfile', 'studentProfile'])
        );
    }

    /**
     * Edit own account details. Email is deliberately not editable here: with
     * email verification deferred (no SMTP yet), letting someone change their
     * login identifier unverified is one typo away from a locked-out account.
     */
    public function updateMe(Request $request) {
        $data = $request->validate([
            'name'  => 'required|string|max:120',
            'phone' => 'nullable|string|max:20',
        ]);
        $request->user()->update($data);
        return new UserResource($request->user()->fresh());
    }

    /**
     * Change own password. Requires the current password (a stolen session
     * must not be enough to take over the account), and revokes every other
     * token so the change actually ends access on other devices — while
     * keeping this session signed in.
     */
    public function changePassword(Request $request) {
        $data = $request->validate([
            'current_password' => 'required|string',
            'password'         => 'required|string|min:8|max:200',
        ]);

        $user = $request->user();
        if (!Hash::check($data['current_password'], $user->password)) {
            throw ValidationException::withMessages(['current_password' => ['Your current password is incorrect.']]);
        }

        $user->update(['password' => $data['password']]); // hashed via cast
        $user->tokens()->where('id', '!=', $user->currentAccessToken()->id)->delete();

        return response()->json(['message' => 'Password changed. Your other devices were signed out.']);
    }
}
