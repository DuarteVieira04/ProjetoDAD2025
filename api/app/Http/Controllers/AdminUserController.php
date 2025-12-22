<?php

namespace App\Http\Controllers;

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
}
