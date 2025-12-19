<?php

use App\Http\Controllers\AdminUserController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CoinsController;
use App\Http\Controllers\GameController;
use App\Http\Middleware\EnsureAdmin;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/register', [AuthController::class, 'register']);

Route::middleware(['auth:sanctum', EnsureAdmin::class])->group(function () {
    // ! Admin Routes
    Route::get('/admin/users', [AdminUserController::class, 'getUsers']);
    Route::get('/admin/user/{userId}', [AdminUserController::class, 'getUserDetails']);
});

Route::middleware('auth:sanctum')->group(function () {
    // ? Logged user routes

    // * Users *//

    Route::get('/users/me', function (Request $request) {
        return $request->user();
    });
    Route::put('/users/me', [AuthController::class, 'update']);

    Route::put('/users/me/password', [AuthController::class, 'changePassword']);

    Route::post('logout', [AuthController::class, 'logout']);

    // * Coins *//

    Route::get('/coins/balance', [CoinsController::class, 'getCurrentUserCoins']);
    Route::get('/coins/transaction', [CoinsController::class, 'getAuthUserCoinsTransactions']);
    Route::get('/coins/test', [CoinsController::class, 'getUserCoinsTransactions']);
    Route::get('/coins/balance/{userId}', [CoinsController::class, 'getUserCoins']);
});

Route::apiResource('games', GameController::class);
