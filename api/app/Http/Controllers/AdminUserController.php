<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class AdminUserController extends Controller
{
    public function getUsers()
    {
        $users = User::all();
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
