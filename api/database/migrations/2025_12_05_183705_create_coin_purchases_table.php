<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('coin_purchases', function (Blueprint $table) {
            $table->id();
            $table->timestamps();

            $table->dateTime('purchase_datetime')->useCurrent();
            $table->foreignId('user_id')->constrained('users');
            $table->foreignId('coin_transaction_id')->constrained('coin_transactions');

            $table->decimal('euros', 8, 2);
            $table->enum('payment_type', ['MBWAY', 'IBAN', 'MB', 'VISA', 'PAYPAL']);
            $table->string('payment_reference', 30);
            $table->json('custom')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('coin_purchases');
    }
};
