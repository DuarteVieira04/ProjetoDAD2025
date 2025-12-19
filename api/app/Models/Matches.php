<?php

namespace App\Models;

use App\Enums\GameEnum;
use App\Enums\MatchEnum;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Matches extends Model
{
    use SoftDeletes;

    protected $table = 'matches';

    protected $fillable = [
        'type',
        'player1_user_id',
        'player2_user_id',
        'winner_user_id',
        'loser_user_id',
        'status',  // enum (gotta figure this)
        'stake',
        'began_at',
        'ended_at',
        'total_time',
        'player1_marks',
        'player2_marks',
        'player1_points',
        'player2_points',
        'custom'
    ];

    protected $casts = [
        'type' => GameEnum::class,
        'status' => MatchEnum::class,
        'began_at' => 'datetime',
        'ended_at' => 'datetime',
        'total_time' => 'decimal:2',
        'player1_marks' => 'integer',
        'player2_marks' => 'integer',
        'player1_points' => 'integer',
        'player2_points' => 'integer',
        'custom' => 'array',
    ];

    public function player1()
    {
        return $this->belongsTo(User::class, 'player1_user_id');
    }

    public function player2()
    {
        return $this->belongsTo(User::class, 'player2_user_id');
    }

    public function winner()
    {
        return $this->belongsTo(User::class, 'winner_user_id');
    }

    public function loser()
    {
        return $this->belongsTo(User::class, 'loser_user_id');
    }

    public function games()
    {
        return $this->hasMany(Game::class, 'match_id');
    }
}
