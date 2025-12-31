<?php

namespace App\Http\Controllers;

use App\Models\CoinTransactions;
use App\Models\Game;
use App\Models\Matches;
use App\Models\User;
use Illuminate\Http\Request;

class AdminUserController extends Controller
{
    public function getUsers(Request $request)
    {
        $perPage = min(
            $request->query('per_page', 15),
            100  // hard limit for safety
        );

        $query = User::query();

        // Optional filters
        if ($request->filled('type')) {
            $query->where('type', $request->query('type'));
        }

        if ($request->has('blocked')) {
            $blocked = $request->query('blocked');

            if ($blocked === '1') {
                $query->where('blocked', true);
            } elseif ($blocked === '0') {
                $query->where('blocked', false);
            }
        }

        if ($request->filled('search')) {
            $search = $request->query('search');

            $query->where(function ($q) use ($search) {
                $q
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('nickname', 'like', "%{$search}%");
            });
        }

        $users = $query
            ->orderBy('id', 'desc')
            ->paginate($perPage);

        return response()->json($users);
    }

    public function getUserDetails($userId)
    {
        $user = User::find($userId);

        if (!$user) {
            return response()->json([
                'error' => 'User not found',
                'id' => $userId
            ], 404);
        }

        return response()->json($user);
    }

    public function blockUser(Request $request, $id)
    {
        $request->validate([
            'blocked' => ['required', 'boolean'],
        ]);

        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'error' => 'User not found',
                'id' => $id,
            ], 404);
        }

        // Optional: prevent blocking admins
        if ($user->is_admin) {
            return response()->json([
                'error' => 'Cannot block an admin user',
            ], 403);
        }

        // 409 — no state change
        if ($user->blocked === $request->blocked) {
            return response()->json([
                'error' => 'User block status already set',
                'blocked' => $user->blocked,
            ], 409);
        }

        $user->blocked = $request->blocked;
        $user->save();

        return response()->json($user, 200);
    }

    public function destroy(User $user, Request $request)
    {
        $admin = $request->user();

        // Prevent admin from deleting their own account
        if ($admin->id === $user->id) {
            return response()->json([
                'error' => 'You cannot delete your own account.'
            ], 403);
        }

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
            'message' => "User '{$user->name}' (ID: {$user->id}) has been deleted."
        ]);
    }
}
