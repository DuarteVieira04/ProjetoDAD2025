<?php

namespace App\Models;

use App\Enums\GameType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Game extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'type',
        'match_id', // Added
        'player1_user_id',
        'player2_user_id',
        'is_draw',
        'winner_user_id',
        'loser_user_id',
        'status',
        'began_at',
        'ended_at',
        'total_time', // Added
        'player1_points',
        'player2_points',
        'custom',
    ];

    /**
     * Attribute casts.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'type' => GameEnum::class,
        'is_draw' => 'boolean',
        'began_at' => 'datetime',
        'ended_at' => 'datetime',
        'player1_points' => 'integer',
        'player2_points' => 'integer',
        'custom' => 'array',  // JSON field
    ];

    public function coinTransactions()
    {
        return $this->hasMany(CoinTransactions::class, 'game_id', 'id');
    }

    public function winner()
    {
        return $this->belongsTo(User::class, 'winner_user_id');
    }

    // New Relationships
    public function loser()
    {
        return $this->belongsTo(User::class, 'loser_user_id');
    }

    public function player1()
    {
        return $this->belongsTo(User::class, 'player1_user_id');
    }

    public function player2()
    {
        return $this->belongsTo(User::class, 'player2_user_id');
    }

    public function match()
    {
        return $this->belongsTo(Matches::class, 'match_id');
    }
}
