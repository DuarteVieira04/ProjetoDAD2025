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

        if ($request->filled('blocked')) {
            $query->where('blocked', (bool) $request->query('blocked'));
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
}
