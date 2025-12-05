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
        Schema::create('coin_transactions', function (Blueprint $table) {
            $table->id();
            $table->timestamps();
            $table->softDeletes();

            $table->string('name', 40);
            $table->enum('type', ['C', 'D']);
            $table->datetime('transaction_datetime')->useCurrent();
            $table->json(column: 'custom')->nullable();

            $table->foreignId('user_id')->constrained('users');
            $table->foreignId('match_id')->constrained('matches');
            $table->foreignId('game_id')->constrained('games');

            $table->foreignId('coin_transaction_type_id')->constrained('coin_transaction_types');

            $table->integer('coins')->default(0);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('matches');
    }
};
