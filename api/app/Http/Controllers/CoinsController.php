<?php

namespace App\Http\Controllers;

use App\Models\CoinTransactions;
use App\Models\User;
use Illuminate\Http\Request;

class CoinsController extends Controller
{
    public function getCurrentUserCoins(Request $request)
    {
        $user = $request->user('sanctum');

        if (!$user) {
            return response()->json(['message' => 'User not found.'], 404);
        }

        return response()->json([
            'balance' => $user->coins_balance
        ], 200);
    }

    public function getUserCoins($userId)
    {
        $user = User::find($userId);
        if (!$user) {
            return response()->json([
                'error' => 'User not found',
                'id' => $userId
            ], 404);
        }

        return response()->json([
            'balance' => $user->coins_balance
        ], 200);
    }

    public function getAuthUserCoinsTransactions(Request $request)
    {
        $user = $request->user('sanctum');

        if (!$user) {
            return response()->json(['message' => 'User not found.'], 404);
        }

        $transactions = CoinTransactions::with(['type', 'game'])
            ->where('user_id', $user->id)
            ->orderBy('transaction_datetime', 'desc')
            ->get();

        return response()->json($transactions);
    }

    public function getUserCoinsTransactions(Request $request)
    {
        $data = $request->validate([
            'id' => 'integer|required'
        ]);

        $user = User::find($data['id']);
        if (!$user) {
            return response()->json(['message' => 'User not found.'], 404);
        }

        $transactions = CoinTransactions::with(['type', 'game'])
            ->where('user_id', $user->id)
            ->orderBy('transaction_datetime', 'desc')
            ->get();

        return response()->json($transactions);
    }
}
