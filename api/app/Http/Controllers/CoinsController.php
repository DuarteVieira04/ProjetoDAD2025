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

    public function purchase(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|string|in:MBWAY,IBAN,MB,VISA,PAYPAL',
            'reference' => 'required|string',
            'value' => 'required|integer|min:1'
        ]);

        // Integrate with external Payment Gateway
        $response = \Illuminate\Support\Facades\Http::post('https://dad-payments-api.vercel.app/api/debit', [
            'type' => $validated['type'],
            'reference' => $validated['reference'],
            'value' => $validated['value']
        ]);

        if (!$response->successful()) {
            return response()->json([
                'message' => 'Payment failed',
                'errors' => $response->json()
            ], $response->status());
        }

        $user = $request->user();

        // 1 Euro = 10 Coins
        $coinsEarned = $validated['value'] * 10;

        try {
            \Illuminate\Support\Facades\DB::beginTransaction();

            $transactionType = \App\Models\CoinTransactionsType::where('name', 'Coin purchase')->first();

            if (!$transactionType) {
                // Fallback or error if seeder didn't run. 
                // Assuming seeder runs, but careful here.
                throw new \Exception("Transaction type 'Coin purchase' not found.");
            }

            // Create Transaction
            $transaction = new CoinTransactions();
            $transaction->user_id = $user->id;
            $transaction->coin_transaction_type_id = $transactionType->id;
            $transaction->coins = $coinsEarned; // Positive for credit
            $transaction->transaction_datetime = now();
            $transaction->save();

            // Create Purchase record
            $purchase = new \App\Models\CoinPurchase();
            $purchase->user_id = $user->id;
            $purchase->coin_transaction_id = $transaction->id;
            $purchase->euros = $validated['value'];
            $purchase->payment_type = $validated['type']; // Casts to Enum automatically if validated against string? PaymentMethodEnum is backed string. 
            // We validated as string, model casts to Enum.
            $purchase->payment_reference = $validated['reference'];
            $purchase->purchase_datetime = now();
            $purchase->save();

            // Update User Balance
            $user->coins_balance += $coinsEarned;
            $user->save();

            \Illuminate\Support\Facades\DB::commit();

            return response()->json([
                'message' => 'Coins purchased successfully',
                'balance' => $user->coins_balance,
                'coins_added' => $coinsEarned
            ], 201);

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            return response()->json(['message' => 'Transaction failed', 'error' => $e->getMessage()], 500);
        }
    }
}
