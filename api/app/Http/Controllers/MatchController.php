<?php

namespace App\Http\Controllers;

use App\Enums\CoinTransactionEnum;
use App\Enums\MatchEnum;
use App\Enums\UserEnum;
use App\Models\CoinTransactions;
use App\Models\Game;
use App\Models\Matches;
use App\Models\User;
use Illuminate\Http\Request;
use Auth;
use Str;

class MatchController extends Controller
{
    public function create(Request $request)
    {
        $request->validate([
            'type' => 'required|in:3,9',
            'mode' => 'required|in:single,multi',  // single = bot, multi = human vs human
            'stake' => 'required_if:mode,multi|integer|min:3|max:100',
        ]);

        $user = $request->user();  // Auth::user()

        if ($user?->blocked || $user?->type === 'A') {
            return response()->json(['error' => 'Unauthorized to play'], 403);
        }

        if ($request->mode === 'single') {
            // === BOT MATCH: NO DB RECORD ===

            // Generate a temporary unique match ID (UUID)
            $tempMatchId = Str::uuid()->toString();

            // Trigger WebSocket event to start bot match immediately
            // This will be caught by the client's Socket.IO connection
            // broadcast(new BotMatchStarted(
            //     userId: $user?->id ?? null,  // null for anonymous
            //     matchId: $tempMatchId,
            //     type: $request->type,
            //     isAnonymous: !$user
            // ))->toOthers();  // Don't send back to sender if needed

            return response()->json([
                'success' => true,
                'mode' => 'single',
                'match_id' => $tempMatchId,
                'type' => $request->type,
                'message' => 'Bot match started. Waiting for game state...'
            ]);
        }

        // === MULTIPLAYER MATCH: Persist in DB ===
        if (!$user) {
            return response()->json(['error' => 'Login required for multiplayer'], 401);
        }

        if ($user->coins_balance < $request->stake) {
            return response()->json(['error' => 'Insufficient coins'], 400);
        }

        $match = Matches::create([
            'type' => $request->type,
            'player1_user_id' => $user->id,
            'status' => 'Pending',
            'stake' => $request->stake,
            'began_at' => now(),
            'player1_marks' => 0,
            'player2_marks' => 0,
            'player1_points' => 0,
            'player2_points' => 0,
        ]);

        // Debit stake from creator
        $this->debitStake($user, $match);

        // Broadcast to lobby (optional) or notify potential opponents
        // broadcast(new MultiplayerMatchCreated($match));

        return response()->json([
            'success' => true,
            'mode' => 'multi',
            'match' => $match->load('player1'),
            'message' => 'Match created. Waiting for opponent...'
        ]);
    }

    public function join(Request $request, $matchId)
    {
        $match = Matches::findOrFail($matchId);

        if ($match->status !== 'Pending' || $match->player2_user_id !== null) {
            return response()->json(['error' => 'Match not available'], 400);
        }

        $user = $request->user();

        if ($user->coins_balance < $match->stake) {
            return response()->json(['error' => 'Insufficient coins'], 400);
        }

        $match->player2_user_id = $user->id;
        $match->status = 'Playing';
        $match->save();

        $this->debitStake($user, $match);

        // Now start first game
        $this->startNextGame($match);

        // Broadcast match started
        // broadcast(new MatchStarted($match->load(['player1', 'player2'])));

        return response()->json($match->fresh()->load(['player1', 'player2', 'games']));
    }

    public function list()
    {
        $matches = Matches::query()
            ->whereIn('status', ['Pending', 'Playing'])
            ->latest()
            ->with(['player1', 'player2'])
            ->get();

        return response()->json($matches, 200);
    }

    private function startNextGame(Matches $match)
    {
        $game = Game::create([
            'type' => $match->type->value,  // since type is cast to GameEnum
            'player1_user_id' => $match->player1_user_id,
            'player2_user_id' => $match->player2_user_id,
            'match_id' => $match->id,
            'status' => 'Playing',  // or your enum/value for playing
            'began_at' => now(),
            // other default fields if needed
        ]);
    }

    private function debitStake(User $user, Matches $match)
    {
        $user->coins_balance -= $match->stake;
        $user->save();

        CoinTransactions::create([
            'transaction_datetime' => now(),
            'user_id' => $user->id,
            'match_id' => $match->id,
            'coin_transaction_type_id' => 4,
            'coins' => -$match->stake,
        ]);
    }
}
