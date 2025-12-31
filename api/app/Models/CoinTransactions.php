<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CoinTransactions extends Model
{
    public $timestamps = false;
    protected $fillable = [
        'transaction_datetime',
        'user_id',
        'match_id',
        'game_id',
        'coin_transaction_type_id',
        'coins',
        'custom'
    ];

    protected $casts = [
        'transaction_datetime' => 'datetime',
        'coins' => 'integer',
        'custom' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }

    public function type()
    {
        return $this->belongsTo(CoinTransactionsType::class, 'coin_transaction_type_id', 'id');
    }

    public function game()
    {
        return $this->belongsTo(Game::class, 'game_id', 'id');
    }
}
