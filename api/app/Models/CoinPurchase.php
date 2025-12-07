<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CoinPurchase extends Model
{
    use SoftDeletes;

    protected $table = 'coin_purchases';

    protected $fillable = [
        'purchase_datetime',
        'user_id',
        'coin_transaction_id',
        'euros',
        'payment_type',
        'payment_reference',
        'custom',
    ];

    protected $casts = [
        'purchase_datetime' => 'datetime',
        'payment_type' => PaymentMethodEnum::class,
        'custom' => 'array',
        'euros' => 'float',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }

    public function coinTransaction()
    {
        return $this->belongsTo(CoinTransactions::class, 'coin_transaction_id', 'id');
    }

    /*
    public function match()
    {
        return $this->belongsTo(Matches::class, 'match_id', 'id');
    }
    */
}
