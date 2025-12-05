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
        Schema::create('games', function (Blueprint $table) {
            $table->id('id');
            $table->timestamps();
            $table->softDeletes();

            $table->enum('type', ['3', '9']);
            $table->enum('status', ['Pending', 'Playing', 'Ended', 'Interrupted']);  // MatchEnum

            $table->foreignId(column: 'match_id')->constrained('matches');
            $table->foreignId(column: 'player1_user_id')->constrained('users');
            $table->foreignId('player2_user_id')->constrained('users');
            $table->foreignId('winner_user_id')->constrained('users');
            $table->foreignId('loser_user_id')->constrained('users');

            $table->tinyInteger('is_draw')->default(0);

            $table->dateTime('began_at')->useCurrent();
            $table->dateTime('ended_at')->nullable()->default(null);
            $table->decimal('total_time', 8, 2)->default(0);

            $table->integer('player1_points')->default(0);
            $table->integer('player2_points')->default(0);

            $table->json(column: 'custom');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('games');
    }
};
