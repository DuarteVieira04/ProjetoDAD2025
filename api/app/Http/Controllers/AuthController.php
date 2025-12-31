<?php

namespace App\Http\Controllers;

use App\Models\CoinTransactions;
use App\Models\Game;
use App\Models\Matches;
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

    public function delete(Request $request)
    {
        $user = $request->user();

        // Check if user has any history in games, matches, or coin transactions
        $hasHistory =
            Game::where('player1_user_id', $user->id)
                ->orWhere('player2_user_id', $user->id)
                ->orWhere('winner_user_id', $user->id)
                ->orWhere('loser_user_id', $user->id)
                ->exists() ||
            Matches::where('player1_user_id', $user->id)
                ->orWhere('player2_user_id', $user->id)
                ->orWhere('winner_user_id', $user->id)
                ->orWhere('loser_user_id', $user->id)
                ->exists() ||
            CoinTransactions::where('user_id', $user->id)
                ->orWhere('from_user_id', $user->id)
                ->orWhere('to_user_id', $user->id)
                ->exists();

        if ($hasHistory) {
            $user->delete();

            User::withTrashed()->where('id', $user->id)->update([
                'name' => 'Deleted User',
                'nickname' => 'deleted_user_' . $user->id,
                'email' => 'deleted_' . $user->id . '@deleted.example.com',
                'phone' => null,
                'avatar' => null,
            ]);
        } else {
            $user->forceDelete();
        }

        $user->tokens()->delete();

        return response()->json([
            'message' => 'Your account has been successfully deleted.'
        ]);
    }
}
