<?php

namespace App\Http\Controllers;

use App\Models\CoinTransactions;
use App\Models\Game;
use App\Models\Matches;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;

class StatisticsController extends Controller
{
    /**
     * Public Statistics
     */
    public function getPublicStatistics()
    {
        return response()->json([
            'total_games' => Game::count(),
            'total_users' => User::count(),
            'total_matches' => Matches::count(),
        ]);
    }

    /**
     * User Statistics
     */
    public function getUserStatistics(Request $request)
    {
        $user = $request->user();

        $matches = Matches::where('player1_user_id', $user->id)
            ->orWhere('player2_user_id', $user->id)
            ->get();

        $matchesPlayed = $matches->count();
        $matchesWon = $matches->where('winner_user_id', $user->id)->count();
        $matchesLost = $matches->where('loser_user_id', $user->id)->count();
        $winLossRatio = $matchesLost > 0 ? round($matchesWon / $matchesLost, 2) : null;

        $totalPoints = Matches::where('player1_user_id', $user->id)
            ->orWhere('player2_user_id', $user->id)
            ->get()
            ->reduce(function ($carry, $match) use ($user) {
                if ($match->player1_user_id === $user->id) {
                    return $carry + $match->player1_points;
                } else {
                    return $carry + $match->player2_points;
                }
            }, 0);

        $averagePoints = $matchesPlayed > 0 ? round($totalPoints / $matchesPlayed, 2) : 0;

        $recentMatches = Matches::whereIn('player1_user_id', [$user->id])
            ->orWhereIn('player2_user_id', [$user->id])
            ->latest('ended_at')
            ->take(10)
            ->get()
            ->map(fn($match) => [
                'ended_at' => $match->ended_at,
                'result' => $match->winner_user_id === null
                    ? 'draw'
                    : ($match->winner_user_id === $user->id ? 'win' : 'loss'),
                'points' => $match->player1_user_id === $user->id
                    ? $match->player1_points
                    : $match->player2_points,
            ]);

        return response()->json([
            'matches_played' => $matchesPlayed,
            'matches_won' => $matchesWon,
            'matches_lost' => $matchesLost,
            'win_loss_ratio' => $winLossRatio,
            'average_points_per_match' => $averagePoints,
            'recent_activity' => $recentMatches,
        ]);
    }

    /**
     * Admin Statistics
     */

    public function getAdminStatistics()
    {
        $response = [
            'total_games' => Game::count(),
            'total_users' => User::count(),
            'total_matches' => Matches::count(),
            'total_purchases' => CoinTransactions::count(),
            'average_game_duration' => Game::whereNotNull('total_time')->avg('total_time')
        ];

        return response()->json(
            $response,
            200
        );
    }

}
