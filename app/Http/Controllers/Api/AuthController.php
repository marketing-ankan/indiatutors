<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Models\UserEmail;
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
        // Any address on the account signs in, not just the primary. That is
        // what makes adding a new address safe: both work while the switch is
        // in progress, so a typo in the new one cannot lock anybody out.
        $user = User::where('email', $data['email'])->first()
            ?? UserEmail::where('email', $data['email'])->first()?->user;
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
    /* ---------------------------------------------------------------------
     * Sign-in addresses.
     *
     * Add a new address, then remove the old one — never a swap in place. With
     * no SMTP there is nothing to verify a new address against, so the account
     * must never be left holding only an address that might be a typo. Both
     * addresses sign in throughout (see login above), so the changeover cannot
     * strand anyone.
     *
     * Every one of these asks for the current password. Without that, anyone
     * who got hold of a live session could bolt their own address onto the
     * account and keep signing in after the real owner changed their password.
     * ------------------------------------------------------------------- */

    /** Reject anything already claimed, as a primary or as somebody's alternate. */
    private function assertEmailFree(string $email): void {
        $taken = User::where('email', $email)->exists()
              || UserEmail::where('email', $email)->exists();
        if ($taken) {
            throw ValidationException::withMessages([
                'email' => ['That email is already in use on an account.'],
            ]);
        }
    }

    private function assertPassword(Request $request, string $field = 'current_password'): void {
        if (!Hash::check((string) $request->input($field), $request->user()->password)) {
            throw ValidationException::withMessages([
                $field => ['That password is not correct.'],
            ]);
        }
    }

    public function emails(Request $request) {
        return response()->json([
            'primary'    => $request->user()->email,
            'additional' => $request->user()->emails()->orderBy('id')->get(['id', 'email']),
        ]);
    }

    public function addEmail(Request $request) {
        $data = $request->validate([
            'email'            => 'required|email|max:180',
            'current_password' => 'required|string',
        ]);
        $this->assertPassword($request);
        $this->assertEmailFree($data['email']);
        $request->user()->emails()->create(['email' => $data['email']]);
        return $this->emails($request);
    }

    /**
     * Swap an alternate with the primary. The old primary is kept as an
     * alternate rather than discarded — removing it stays a separate, deliberate
     * step, which is the whole point of the add-then-remove order.
     */
    public function makeEmailPrimary(Request $request, UserEmail $userEmail) {
        $request->validate(['current_password' => 'required|string']);
        $this->assertPassword($request);
        $user = $request->user();
        abort_unless($userEmail->user_id === $user->id, 404);

        $oldPrimary = $user->email;
        $user->forceFill(['email' => $userEmail->email])->save();
        $userEmail->update(['email' => $oldPrimary]);

        return $this->emails($request);
    }

    public function removeEmail(Request $request, UserEmail $userEmail) {
        $request->validate(['current_password' => 'required|string']);
        $this->assertPassword($request);
        abort_unless($userEmail->user_id === $request->user()->id, 404);
        $userEmail->delete();
        return $this->emails($request);
    }

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
