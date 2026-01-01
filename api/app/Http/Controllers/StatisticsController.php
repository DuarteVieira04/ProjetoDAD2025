<?php

namespace App\Http\Controllers;

use App\Models\CoinTransactions;
use App\Models\Game;
use App\Models\Matches;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StatisticsController extends Controller
{
    /**
     * Public statistics available to all users including anonymous visitors.
     * Returns only anonymized, aggregated data.
     */
    public function getPublicStatistics()
    {
        $response = [
            'total_games' => Game::count(),
            'total_users' => User::count(),
            'total_matches' => Matches::count(),
        ];

        return response()->json($response, 200);
    }

    /**
     * User-specific statistics for authenticated users.
     * Shows personal stats and recent activity.
     */
    public function getUserStatistics(Request $request)
    {
        try {
            $user = $request->user();
            if (!$user) {
                return response()->json(['message' => 'Unauthenticated'], 401);
            }

            $matchesAsPlayer1 = Matches::where('player1_user_id', $user->id)->whereNotNull('ended_at');
            $matchesAsPlayer2 = Matches::where('player2_user_id', $user->id)->whereNotNull('ended_at');
            
            $allMatches = $matchesAsPlayer1->union($matchesAsPlayer2->getQuery())->get();
            
            $matchesPlayed = $allMatches->count();
            $matchesWon = $allMatches->where('winner_user_id', $user->id)->count();
            $matchesLost = $matchesPlayed - $matchesWon;
            
            $winLossRatio = $matchesLost > 0 ? $matchesWon / $matchesLost : $matchesWon;
            
            $totalPoints = 0;
            foreach ($allMatches as $match) {
                if ($match->player1_user_id == $user->id) {
                    $totalPoints += $match->player1_points ?? 0;
                } else {
                    $totalPoints += $match->player2_points ?? 0;
                }
            }
            $avgPointsPerMatch = $matchesPlayed > 0 ? $totalPoints / $matchesPlayed : 0;

            $recentMatches = Matches::where(function ($q) use ($user) {
                $q->where('player1_user_id', $user->id)
                  ->orWhere('player2_user_id', $user->id);
            })
            ->whereNotNull('ended_at')
            ->orderBy('ended_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($match) use ($user) {
                $isPlayer1 = $match->player1_user_id == $user->id;
                $points = $isPlayer1 ? $match->player1_points : $match->player2_points;
                $result = $match->winner_user_id == $user->id ? 'win' : 
                         ($match->winner_user_id === null ? 'draw' : 'loss');
                
                return [
                    'ended_at' => $match->ended_at,
                    'points' => $points ?? 0,
                    'result' => $result,
                ];
            });

            return response()->json([
                'matches_played' => $matchesPlayed,
                'matches_won' => $matchesWon,
                'matches_lost' => $matchesLost,
                'win_loss_ratio' => $winLossRatio,
                'average_points_per_match' => $avgPointsPerMatch,
                'recent_activity' => $recentMatches,
            ], 200);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Server error retrieving user statistics', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Admin-only statistics with full, non-anonymized access.
     * Includes detailed breakdowns and time-series data.
     */
    public function getAdminStatistics(Request $request)
    {
        try {
            $totalGames = Game::count();
            $totalUsers = User::count();
            $totalMatches = Matches::count();

            $totalPurchases = CoinTransactions::where('coin_transaction_type_id', 2)->count();
            $totalCoinsSpent = CoinTransactions::where('coin_transaction_type_id', 4)->sum('coins') ?? 0;
            $totalCoinsWon = CoinTransactions::where('coin_transaction_type_id', 6)->sum('coins') ?? 0;
            $totalCoinsPurchased = CoinTransactions::where('coin_transaction_type_id', 2)->sum('coins') ?? 0;

            $thirtyDaysAgo = now()->subDays(30)->format('Y-m-d H:i:s');
            $recentGames = Game::where('began_at', '>=', $thirtyDaysAgo)->count();
            $recentMatches = Matches::where('began_at', '>=', $thirtyDaysAgo)->count();
            $recentUsers = User::where('created_at', '>=', $thirtyDaysAgo)->count();

            $gamesByDay = DB::select("
                SELECT DATE(began_at) as date, COUNT(*) as count
                FROM games
                WHERE began_at >= ?
                GROUP BY DATE(began_at)
                ORDER BY date
            ", [$thirtyDaysAgo]);

            $matchesByDay = DB::select("
                SELECT DATE(began_at) as date, COUNT(*) as count
                FROM matches
                WHERE began_at >= ?
                GROUP BY DATE(began_at)
                ORDER BY date
            ", [$thirtyDaysAgo]);

            $purchasesByDay = DB::select("
                SELECT DATE(transaction_datetime) as date, COUNT(*) as count, SUM(coins) as total_coins
                FROM coin_transactions
                WHERE coin_transaction_type_id = 2 AND transaction_datetime >= ?
                GROUP BY DATE(transaction_datetime)
                ORDER BY date
            ", [$thirtyDaysAgo]);

            $topPurchasers = DB::select("
                SELECT user_id, SUM(coins) as total_coins, COUNT(*) as purchase_count
                FROM coin_transactions
                WHERE coin_transaction_type_id = 2 AND user_id IS NOT NULL
                GROUP BY user_id
                ORDER BY total_coins DESC
                LIMIT 10
            ");
            
            $topPurchasers = collect($topPurchasers)->map(function ($item) {
                $user = User::find($item->user_id);
                return [
                    'user_id' => $item->user_id,
                    'name' => $user ? $user->name : 'Unknown',
                    'nickname' => $user ? ($user->nickname ?: $user->name) : 'Unknown',
                    'total_coins' => (int)$item->total_coins,
                    'purchase_count' => (int)$item->purchase_count,
                ];
            });

            $mostActivePlayers = DB::select("
                SELECT user_id, COUNT(*) as match_count
                FROM (
                    SELECT player1_user_id as user_id FROM matches WHERE player1_user_id IS NOT NULL
                    UNION ALL
                    SELECT player2_user_id as user_id FROM matches WHERE player2_user_id IS NOT NULL
                ) as all_players
                GROUP BY user_id
                ORDER BY match_count DESC
                LIMIT 10
            ");
            
            $mostActivePlayers = collect($mostActivePlayers)->map(function ($item) {
                $user = User::find($item->user_id);
                return [
                    'user_id' => $item->user_id,
                    'name' => $user ? $user->name : 'Unknown',
                    'nickname' => $user ? ($user->nickname ?: $user->name) : 'Unknown',
                    'match_count' => (int)$item->match_count,
                ];
            });

            return response()->json([
                'overview' => [
                    'total_games' => $totalGames,
                    'total_users' => $totalUsers,
                    'total_matches' => $totalMatches,
                    'total_purchases' => $totalPurchases,
                    'total_coins_spent' => $totalCoinsSpent,
                    'total_coins_won' => $totalCoinsWon,
                    'total_coins_purchased' => $totalCoinsPurchased,
                ],
                'recent_activity' => [
                    'recent_games_30d' => $recentGames,
                    'recent_matches_30d' => $recentMatches,
                    'recent_users_30d' => $recentUsers,
                ],
                'time_series' => [
                    'games_by_day' => $gamesByDay,
                    'matches_by_day' => $matchesByDay,
                    'purchases_by_day' => $purchasesByDay,
                ],
                'top_players' => [
                    'top_purchasers' => $topPurchasers,
                    'most_active_players' => $mostActivePlayers,
                ],
            ], 200);
        } catch (\Throwable $e) {
            \Log::error('Admin statistics error', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            return response()->json([
                'message' => 'Server error retrieving admin statistics', 
                'error' => $e->getMessage(),
                'line' => $e->getLine()
            ], 500);
        }
    }

    /**
     * Public global leaderboards (visible to all users, including anonymous visitors).
     * Highlights top players by game and match wins and includes capotes and bandeiras.
     * Query params: ?limit=50
     */
    public function getGlobalLeaderboard(Request $request)
    {
        $limit = (int) $request->query('limit', 50);

        $topGames = DB::table('games')
            ->select('winner_user_id as user_id', DB::raw('count(*) as wins'), DB::raw('max(ended_at) as reached_at'))
            ->whereNotNull('winner_user_id')
            ->groupBy('winner_user_id')
            ->orderByDesc('wins')
            ->orderBy('reached_at')
            ->limit($limit)
            ->get()
            ->keyBy('user_id');

        $topMatches = DB::table('matches')
            ->select('winner_user_id as user_id', DB::raw('count(*) as wins'), DB::raw('max(ended_at) as reached_at'))
            ->whereNotNull('winner_user_id')
            ->groupBy('winner_user_id')
            ->orderByDesc('wins')
            ->orderBy('reached_at')
            ->limit($limit)
            ->get()
            ->keyBy('user_id');

        $capotes = DB::table('matches')
            ->select('winner_user_id as user_id', DB::raw('count(*) as capotes'))
            ->whereRaw('(
                (winner_user_id = player1_user_id AND player1_marks >= 2 AND player1_marks < 4) OR
                (winner_user_id = player2_user_id AND player2_marks >= 2 AND player2_marks < 4)
            )')
            ->groupBy('winner_user_id')
            ->get()
            ->keyBy('user_id');

        $bandeiras = DB::table('matches')
            ->select('winner_user_id as user_id', DB::raw('count(*) as bandeiras'))
            ->whereRaw('(
                (winner_user_id = player1_user_id AND player1_marks >= 4) OR
                (winner_user_id = player2_user_id AND player2_marks >= 4)
            )')
            ->groupBy('winner_user_id')
            ->get()
            ->keyBy('user_id');

        $userIds = array_unique(array_merge(array_keys($topGames->toArray()), array_keys($topMatches->toArray())));
        $users = User::whereIn('id', $userIds)->get()->keyBy('id');

        $formatEntry = function ($uid, $entry, $type) use ($users, $capotes, $bandeiras) {
            $user = $users->get($uid);
            $name = $user ? $user->name : null;
            $nickname = $user ? ($user->nickname ?: $name) : null;
            return [
                'user_id' => $uid,
                'nickname' => $nickname,
                'name' => $name,
                ($type === 'game' ? 'game_wins' : 'match_wins') => (int) $entry->wins,
                'reached_at' => $entry->reached_at,
                'capotes' => isset($capotes[$uid]) ? (int) $capotes[$uid]->capotes : 0,
                'bandeiras' => isset($bandeiras[$uid]) ? (int) $bandeiras[$uid]->bandeiras : 0,
            ];
        };

        $topGamesList = [];
        foreach ($topGames as $uid => $entry) {
            $topGamesList[] = $formatEntry($uid, $entry, 'game');
        }

        $topMatchesList = [];
        foreach ($topMatches as $uid => $entry) {
            $topMatchesList[] = $formatEntry($uid, $entry, 'match');
        }

        return response()->json([
            'top_by_games' => $topGamesList,
            'top_by_matches' => $topMatchesList,
        ], 200);
    }

    /**
     * Personal leaderboard (visible only to the owner). Returns totals for game wins, match wins,
     * capotes and bandeiras. Optionally segmented by variant via `variant` query param.
     */
    public function getPersonalLeaderboard(Request $request)
    {
        try {
            $user = $request->user();
            if (!$user) {
                return response()->json(['message' => 'Unauthenticated'], 401);
            }

            $variant = $request->query('variant');

            $gameWinsQuery = Game::where('winner_user_id', $user->id);
            $matchWinsQuery = Matches::where('winner_user_id', $user->id);

            if ($variant) {
                $gameWinsQuery->where('type', $variant);
                $matchWinsQuery->where('type', $variant);
            }

            $gameWins = $gameWinsQuery->count();
            $matchWins = $matchWinsQuery->count();

            // Capotes: matches where this user (as player1 or player2) had marks >=2 and <4
            $capotesQuery = Matches::where(function ($q) use ($user) {
                $q->where(function ($q2) use ($user) {
                    $q2->where('player1_user_id', $user->id)
                        ->where('player1_marks', '>=', 2)
                        ->where('player1_marks', '<', 4);
                })->orWhere(function ($q2) use ($user) {
                    $q2->where('player2_user_id', $user->id)
                        ->where('player2_marks', '>=', 2)
                        ->where('player2_marks', '<', 4);
                });
            });

            // Bandeiras: marks >=4
            $bandeirasQuery = Matches::where(function ($q) use ($user) {
                $q->where(function ($q2) use ($user) {
                    $q2->where('player1_user_id', $user->id)
                        ->where('player1_marks', '>=', 4);
                })->orWhere(function ($q2) use ($user) {
                    $q2->where('player2_user_id', $user->id)
                        ->where('player2_marks', '>=', 4);
                });
            });

            if ($variant) {
                $capotesQuery->where('type', $variant);
                $bandeirasQuery->where('type', $variant);
            }

            $capotesCount = $capotesQuery->count();
            $bandeirasCount = $bandeirasQuery->count();

            $response = [
                'user_id' => $user->id,
                'name' => $user->name ?: $user->name,
                'name' => $user->name,
                'game_wins' => $gameWins,
                'match_wins' => $matchWins,
                'capotes' => $capotesCount,
                'bandeiras' => $bandeirasCount,
            ];
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Server error retrieving personal leaderboard', 'error' => $e->getMessage()], 500);
        }

        if ($request->query('segment_by_variant')) {
            $variants = Matches::select('type')->distinct()->pluck('type')->merge(Game::select('type')->distinct()->pluck('type'));
            // Ensure variant keys are scalars (strings) — models may cast `type` to an Enum instance.
            $variants = $variants->map(function ($t) {
                if (is_object($t)) {
                    if ($t instanceof \BackedEnum) {
                        return $t->value;
                    }
                    if ($t instanceof \UnitEnum) {
                        return $t->name;
                    }
                    return (string) $t;
                }
                return $t;
            })->unique()->values();

            $byVariant = [];
            foreach ($variants as $v) {
                $key = is_object($v) ? (string) $v : $v;
                $byVariant[$key] = [
                    'game_wins' => Game::where('winner_user_id', $user->id)->where('type', $key)->count(),
                    'match_wins' => Matches::where('winner_user_id', $user->id)->where('type', $key)->count(),
                    'capotes' => Matches::where('winner_user_id', $user->id)
                        ->where('type', $key)
                        ->where(function ($q) {
                            $q->whereColumn('winner_user_id', 'player1_user_id')
                                ->where('player1_marks', '>=', 2)
                                ->where('player1_marks', '<', 4);
                            $q->orWhere(function ($q2) {
                                $q2->whereColumn('winner_user_id', 'player2_user_id')
                                    ->where('player2_marks', '>=', 2)
                                    ->where('player2_marks', '<', 4);
                            });
                        })->count(),
                    'bandeiras' => Matches::where('winner_user_id', $user->id)
                        ->where('type', $key)
                        ->where(function ($q) {
                            $q->whereColumn('winner_user_id', 'player1_user_id')
                                ->where('player1_marks', '>=', 4);
                            $q->orWhere(function ($q2) {
                                $q2->whereColumn('winner_user_id', 'player2_user_id')
                                    ->where('player2_marks', '>=', 4);
                            });
                        })->count(),
                ];
            }

            $response['by_variant'] = $byVariant;
        }

        return response()->json($response, 200);
    }
}
