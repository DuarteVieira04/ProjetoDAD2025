<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if (!Auth::attempt($request->only('email', 'password'))) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $user = Auth::user();
        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ]);
    }

    public function register(Request $request)
    {
        $data = $request->validate([
            'name' => 'required',
            'nickname' => 'required|unique:users,nickname',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:3'
        ]);

        $user = User::create([
            'name' => $data['name'],
            'nickname' => $data['nickname'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'type' => 'P',  // default: player
            'coins_balance' => 10  // welcome bonus
        ]);

        // Sanctum token
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token
        ], 201);
    }

    public function update(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'name' => 'sometimes|string|max:255',
            'nickname' => 'sometimes|string|max:255',
            'avatar' => 'sometimes|url',  // or 'sometimes|image' if uploading files
        ]);

        $user->update($validated);

        return response()->json([
            'success' => true,
            'user' => $user
        ]);
    }

    public function changePassword(Request $request)
    {
        // 1. Validate the request
        $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8',
        ]);

        // 2. Get the authenticated user
        $user = $request->user('sanctum');

        if (!$user) {
            return response()->json(['message' => 'User not found.'], 404);
        }

        // 3. Check if the current password matches
        if (!\Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => 'Current password is incorrect.'], 400);
        }

        // 4. Update the password
        $user->password = \Hash::make($request->new_password);
        $user->save();

        return response()->json(['message' => 'Password changed successfully.']);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully',
        ]);
    }
}
