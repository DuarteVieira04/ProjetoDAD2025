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
