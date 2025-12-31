<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Model;

class Matches extends Model
{
    protected $table = 'matches';
    public $timestamps = false;

    protected $fillable = [
        'type',
        'player1_user_id',
        'player2_user_id',
        'winner_user_id',
        'loser_user_id',
        'status',
        'stake',
        'began_at',
        'ended_at',
        'total_time',
        'player1_marks',
        'player2_marks',
        'player1_points',
        'player2_points',
        'custom',
    ];

    protected $casts = [
        'began_at' => 'datetime',
        'ended_at' => 'datetime',
        'total_time' => 'decimal:2',
        'player1_marks' => 'integer',
        'player2_marks' => 'integer',
        'player1_points' => 'integer',
        'player2_points' => 'integer',
        'custom' => 'array',
    ];

    // Relationships
    public function player1(): BelongsTo
    {
        return $this->belongsTo(User::class, 'player1_user_id');
    }

    public function player2(): BelongsTo
    {
        return $this->belongsTo(User::class, 'player2_user_id');
    }

    public function winner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'winner_user_id');
    }

    public function loser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'loser_user_id');
    }

    public function games(): HasMany
    {
        return $this->hasMany(Game::class, 'match_id');
    }
}
