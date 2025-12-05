<?php

namespace App\Models;

use App\Enums\CoinTransactionEnum;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CoinTransactionsType extends Model
{
    use SoftDeletes;

    protected $table = 'coin_transaction_types';
    protected $primary_key = 'id';
    protected $keyType = 'int';

    protected $fillable = [
        'name',
        'type',
        'deleted_at',
        'custom'
    ];

    protected $casts = [
        'deleted_at' => 'datetime',
        'type' => CoinTransactionEnum::class,
    ];
}
