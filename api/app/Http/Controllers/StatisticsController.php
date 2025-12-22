<?php

namespace App\Http\Controllers;

use App\Models\CoinTransactions;
use App\Models\Game;
use App\Models\Matches;
use App\Models\User;
use Illuminate\Http\Request;

class StatisticsController extends Controller
{
    public function getStatistics()
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
