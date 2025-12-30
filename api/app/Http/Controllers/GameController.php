<?php

namespace App\Http\Controllers;

use App\Models\Game;
use App\Models\Matches;
use Illuminate\Http\Request;

class GameController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Game::query()->with(['winner']);

        if ($request->has('type') && in_array($request->type, ['3', '9'])) {
            $query->where('type', $request->type);
        }

        if ($request->has('status') && in_array($request->status, ['Pending', 'Playing', 'Ended', 'Interrupted'])) {
            $query->where('status', $request->status);
        }

        // Sorting
        $sortField = $request->input('sort_by', 'began_at');
        $sortDirection = $request->input('sort_direction', 'desc');

        $allowedSortFields = [
            'began_at',
            'ended_at',
            'total_time',
            'type',
            'status'
        ];

        if (in_array($sortField, $allowedSortFields)) {
            $query->orderBy($sortField, $sortDirection === 'asc' ? 'asc' : 'desc');
        }

        // Pagination
        $perPage = $request->input('per_page', 15);
        $games = $query->paginate($perPage);

        return response()->json([
            'data' => $games->items(),
            'meta' => [
                'current_page' => $games->currentPage(),
                'last_page' => $games->lastPage(),
                'per_page' => $games->perPage(),
                'total' => $games->total()
            ]
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|in:3,9',
            'status' => 'required|in:Pending,Playing,Ended,Interrupted',
            'player1_user_id' => 'required|exists:users,id',
            'player2_user_id' => 'required|exists:users,id',
            'winner_user_id' => 'nullable|exists:users,id',
            'loser_user_id' => 'nullable|exists:users,id',
            'player1_points' => 'nullable|integer',
            'player2_points' => 'nullable|integer',
            'is_draw' => 'boolean',
            'match_id' => 'nullable|exists:matches,id',
            'began_at' => 'nullable|date',
            'ended_at' => 'nullable|date',
            'total_time' => 'nullable|numeric',
        ]);

        if (!isset($validated['began_at'])) {
            $validated['began_at'] = date('Y-m-d H:i:s');
        }
        if (!isset($validated['ended_at'])) {
            $validated['ended_at'] = date('Y-m-d H:i:s');
        }

        // Check for debit if standalone multiplayer
        if ($validated['type'] == '3' || $validated['type'] == '9') {
            // Coin check logic
            $user = $request->user();
            if ($user && empty($validated['match_id'])) {
                if ($user->coins_balance < 2) {
                    return response()->json(['error' => 'Insufficient coins'], 400);
                }

                $user->coins_balance -= 2;
                $user->save();

                // Log Transaction
                \App\Models\CoinTransactions::create([
                    'transaction_datetime' => now(),
                    'user_id' => $user->id,
                    'game_id' => null,
                    'coin_transaction_type_id' => 3,
                    'coins' => -2,
                ]);
            }
        }

        $game = Game::create($validated);

        // Update transaction with game_id
        if (isset($user) && empty($validated['match_id'])) {
            \App\Models\CoinTransactions::where('user_id', $user->id)
                ->where('coins', -2)
                ->latest()
                ->first()
                    ?->update(['game_id' => $game->id]);
        }

        return response()->json($game, 201);
    }

    public function update(Request $request, Game $game)
    {
        // Only allow updates if game is playing or pending
        if (!in_array($game->status, ['Pending', 'Playing'])) {
            return response()->json($game);
        }

        $validated = $request->validate([
            'status' => 'required|in:Ended,Interrupted',
            'winner_user_id' => 'nullable|exists:users,id',
            'loser_user_id' => 'nullable|exists:users,id',
            'player1_points' => 'required|integer',
            'player2_points' => 'required|integer',
            'is_draw' => 'boolean',
            'total_time' => 'nullable|integer',
        ]);

        $game->update(array_merge($validated, ['ended_at' => now()]));

        // Handle Standalone Payouts
        if ($game->match_id === null && $validated['status'] === 'Ended') {
            $this->processGamePayout($game);
        }

        return response()->json($game);
    }

    private function processGamePayout(Game $game)
    {
        if ($game->is_draw) {
            // Refund 1 coin each
            $this->creditUser($game->player1_user_id, 1, $game->id, 'Game fee refund (Draw)');
            $this->creditUser($game->player2_user_id, 1, $game->id, 'Game fee refund (Draw)');
            return;
        }

        if ($game->winner_user_id) {
            $points = ($game->winner_user_id == $game->player1_user_id) ? $game->player1_points : $game->player2_points;

            $reward = 3; // Basic win
            if ($points == 120)
                $reward = 6;
            else if ($points >= 91)
                $reward = 4;

            $this->creditUser($game->winner_user_id, $reward, $game->id, 'Game payout');
        }
    }

    private function creditUser($userId, $amount, $gameId, $reason)
    {
        $user = \App\Models\User::find($userId);
        if ($user) {
            $user->coins_balance += $amount;
            $user->save();

            // Look up type by name or IDs. 
            // "Game payout" -> ID 5? "Game fee" -> ID 3?
            // "Coin purchase" -> 1? "Bonus" -> 2? 
            // I'll assume IDs or find by name.
            $typeId = \App\Models\CoinTransactionsType::where('name', $reason)->first()?->id ?? 5; // Default to Payout ID

            \App\Models\CoinTransactions::create([
                'transaction_datetime' => now(),
                'user_id' => $user->id,
                'game_id' => $gameId,
                'coin_transaction_type_id' => $typeId,
                'coins' => $amount,
            ]);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Game $game)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Game $game)
    {
        //
    }
}
