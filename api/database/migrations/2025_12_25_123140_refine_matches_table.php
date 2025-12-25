<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('matches', function (Blueprint $table) {
            // Make marks and points start at 0 instead of null
            $table->integer('player1_marks')->default(0)->nullable(false)->change();
            $table->integer('player2_marks')->default(0)->nullable(false)->change();
            $table->integer('player1_points')->default(0)->nullable(false)->change();
            $table->integer('player2_points')->default(0)->nullable(false)->change();

            // Add default to status
            $table
                ->enum('status', ['Pending', 'Playing', 'Ended', 'Interrupted'])
                ->default('Pending')
                ->change();

            // Optional: if you ever want bot matches persisted, make player2 nullable
            // $table->unsignedBigInteger('player2_user_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('matches', function (Blueprint $table) {
            $table->integer('player1_marks')->nullable()->change();
            $table->integer('player2_marks')->nullable()->change();
            $table->integer('player1_points')->nullable()->change();
            $table->integer('player2_points')->nullable()->change();

            $table
                ->enum('status', ['Pending', 'Playing', 'Ended', 'Interrupted'])
                ->change();
        });
    }
};
