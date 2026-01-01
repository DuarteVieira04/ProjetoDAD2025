<?php

use App\Http\Controllers\AdminUserController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CoinsController;
use App\Http\Controllers\GameController;
use App\Http\Controllers\MatchController;
use App\Http\Controllers\StatisticsController;
use App\Http\Middleware\EnsureAdmin;
use App\Http\Middleware\EnsureUser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/register', [AuthController::class, 'register']);

Route::get('/statistics/public', [StatisticsController::class, 'getPublicStatistics']);

// Leaderboards
Route::get('/leaderboards/global', [StatisticsController::class, 'getGlobalLeaderboard']);

Route::middleware(['auth:sanctum', EnsureAdmin::class])->group(function () {
    // ! Admin Routes
    Route::get('/admin/users', [AdminUserController::class, 'getUsers']);
    Route::get('/admin/user/{userId}', [AdminUserController::class, 'getUserDetails']);
    Route::put('/admin/user/{userId}', [AdminUserController::class, 'blockUser']);
    Route::delete('/admin/user/{user}', [AdminUserController::class, 'destroy']);

    // ! Statistics Route
    Route::get('/statistics', action: [StatisticsController::class, 'getAdminStatistics']);
    
    // ! Match history - Admin only
    Route::get('/matches/history/all', [MatchController::class, 'getAllHistory']);
});

Route::middleware('auth:sanctum')->group(function () {
    // ? Logged user routes

    // * Users *//

    Route::get('/users/me', function (Request $request) {
        return $request->user();
    });
    Route::put('/users/me', [AuthController::class, 'update']);
    Route::delete('/users/me/delete', [AuthController::class, 'delete']);

    Route::put('/users/me/password', [AuthController::class, 'changePassword']);

    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // * Coins *//

    Route::get('/coins/balance', [CoinsController::class, 'getCurrentUserCoins']);
    Route::get('/coins/transaction', [CoinsController::class, 'getAuthUserCoinsTransactions']);
    Route::get('/coins/purchases', [CoinsController::class, 'getAuthUserPurchaseHistory']);
    Route::post('/coins/purchase', [CoinsController::class, 'purchase'])->middleware([EnsureUser::class]);

    // * Admin Coin Endpoints *//
    // Gotta look further into these
    Route::get('/coins/test', [CoinsController::class, 'getUserCoinsTransactions']);
    Route::get('/coins/balance/{userId}', [CoinsController::class, 'getUserCoins']);

    // * Matches */
    Route::post('/matches', [MatchController::class, 'create']);
    Route::post('/matches/{match}/join', [MatchController::class, 'join']);
    Route::put('/matches/{match}', [MatchController::class, 'update']);
    
    // Match history
    Route::get('/matches/history/my', [MatchController::class, 'getUserHistory']);
    Route::get('/matches/{matchId}/details', [MatchController::class, 'getMatchDetails']);

    Route::get('/statistics/me', [StatisticsController::class, 'getUserStatistics']);
    
    // Personal leaderboard (authenticated)
    Route::get('/leaderboards/personal', [StatisticsController::class, 'getPersonalLeaderboard']);
});

Route::get('/matches', [MatchController::class, 'list']);

Route::apiResource('games', GameController::class);

// Temporary Test Route for Game Logic
Route::get('/test-game-logic', function () {
    $game = new \App\Game\BiscaGameState(9);  // Bisca de 9
    $game->start();

    // Simulate a trick
    $card1 = $game->player1Hand->pop();
    $card2 = $game->player2Hand->pop();

    $winner = \App\Game\BiscaGameLogic::calculateTrickWinner($card1, $card2, $game->trumpCard->suit);

    return response()->json([
        'trump' => $game->trumpCard->toString(),
        'player1_card' => $card1->toString(),
        'player2_card' => $card2->toString(),
        'trick_winner' => 'Player ' . $winner,
        'deck_remaining' => $game->deck->count(),
        'p1_hand_count' => $game->player1Hand->count(),
        'points_card1' => $card1->getPoints(),
        'points_card2' => $card2->getPoints(),
        'marks_test_capote' => \App\Game\BiscaGameLogic::calculateMarks(100),  // Should be 2
        'marks_test_bandeira' => \App\Game\BiscaGameLogic::calculateMarks(120),  // Should be 4
    ]);
});
