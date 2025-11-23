<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\GameController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\StatisticsController;
use App\Http\Controllers\CoinController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/users/me', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::post('/auth/login', [AuthController::class, "login"]);
Route::post('/auth/logout', [AuthController::class, "logout"])->middleware('auth:sanctum');

// USER CRUD
Route::get('/users', [UserController::class, 'getAllUsers'])->middleware('auth:sanctum');
Route::post('users/register', [UserController::class, 'register']);
Route::post('users/createAdminAccount', [UserController::class, 'createAdminAccount'])->middleware('auth:sanctum');
Route::put('/users/update', [UserController::class, 'update'])->middleware('auth:sanctum');
Route::put('/users/update-password', [UserController::class, 'updatePassword'])->middleware('auth:sanctum');
Route::put('/users/update-photo', [UserController::class, 'updatePhoto'])->middleware('auth:sanctum');
Route::patch('/users/desativate-account', [UserController::class, 'deactivateAccount'])->middleware('auth:sanctum');
Route::patch('/users/{userId}/toggle-block', [UserController::class, 'toggleBlock'])->middleware('auth:sanctum');
Route::delete('/users/{userId}', [UserController::class, 'removeUser'])->middleware('auth:sanctum');

Route::get('/users/{userId}', [UserController::class, 'show'])->middleware('auth:sanctum');
Route::get('/users/{userId}/coins', [UserController::class, 'getUserGameCoins'])->middleware('auth:sanctum');
Route::patch('/users/{userId}/update-coins', [UserController::class, 'updateUserGameCoins'])->middleware('auth:sanctum');
Route::get('/users/{userId}/games', [GameController::class, 'getUserGames'])->middleware('auth:sanctum');
Route::get('/users/{userId}/transactions', [TransactionController::class, 'getUserTransactions'])->middleware('auth:sanctum');

//TRANSACTION CRUD
Route::post('/transactions', [TransactionController::class, 'createTransaction'])->middleware('auth:sanctum');
Route::get('/transactions/total/{period}', [TransactionController::class, 'totalSalesByPeriod'])->middleware('auth:sanctum'); 
Route::get('/transactions/player/{userId}', [TransactionController::class, 'totalSalesByPlayer'])->middleware('auth:sanctum'); 
Route::get('/transactions/payment-type', [TransactionController::class, 'revenueByPaymentType'])->middleware('auth:sanctum'); 
Route::get('/transactions/{userId}/total-spent', [TransactionController::class, 'getTotalSpentByUser'])->middleware('auth:sanctum'); 
Route::get('/transactions/{userId}/payment-type', [TransactionController::class, 'getMostUsedPaymentMethod'])->middleware('auth:sanctum'); 

//STATISTICS
Route::get('/statistics/total-users', [StatisticsController::class, 'getTotalUsers']);
Route::get('/statistics/total-games', [StatisticsController::class, 'getTotalGames']);
Route::get('/statistics/games-last-week', [StatisticsController::class, 'getGamesLastWeek']);
Route::get('/statistics/games-last-month', [StatisticsController::class, 'getGamesLastMonth']);

//GAME
Route::get('/games/leaderboard/global', [GameController::class, 'getGlobalLeaderboard']);
Route::get('/games/leaderboard/personal/{id}', [GameController::class, 'getPersonalLeaderboard'])->middleware('auth:sanctum');
Route::get('/games/leaderboard/multiplayer', [GameController::class, 'getMultiplayerLeaderboard']);
Route::get('/games/leaderboard/personal/best/{id}', [GameController::class, 'getBestPersonal'])->middleware('auth:sanctum');
Route::post('/games/save', [GameController::class, 'saveGame'])->middleware('auth:sanctum');
Route::get('/games', [GameController::class, 'index'])->middleware('auth:sanctum');
Route::post('/games', [GameController::class, 'store'])->middleware('auth:sanctum');
Route::patch('/games', [GameController::class, 'finishGame'])->middleware('auth:sanctum');
