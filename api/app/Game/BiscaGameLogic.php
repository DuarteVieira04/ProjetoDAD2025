<?php

namespace App\Game;

class BiscaGameLogic
{
    /**
     * Determines the winner of a trick.
     *
     * @param Card $firstCard The card played by the first player (lead).
     * @param Card $secondCard The card played by the second player.
     * @param BiscaSuit $trumpSuit The trump suit of the current game.
     * @return int Returns 1 if first player wins, 2 if second player wins.
     */
    public static function calculateTrickWinner(Card $firstCard, Card $secondCard, BiscaSuit $trumpSuit): int
    {
        // 1. Check if second card matches the lead suit
        if ($secondCard->suit === $firstCard->suit) {
            return self::getCardPower($firstCard->rank) > self::getCardPower($secondCard->rank) ? 1 : 2;
        }

        // 2. Different suits. Check if second card is Trump.
        if ($secondCard->suit === $trumpSuit) {
            return 2; // Trump beats non-trump.
        }

        // 3. Different suits, second card is NOT trump. First card wins.
        return 1;
    }

    private static function getCardPower(BiscaRank $rank): int
    {
        return match ($rank) {
            BiscaRank::ACE => 10,
            BiscaRank::SEVEN => 9,
            BiscaRank::KING => 8,
            BiscaRank::JACK => 7,
            BiscaRank::QUEEN => 6,
            BiscaRank::SIX => 5,
            BiscaRank::FIVE => 4,
            BiscaRank::FOUR => 3,
            BiscaRank::THREE => 2,
            BiscaRank::TWO => 1,
        };
    }

    /**
     * Calculates the marks awarded to the winner based on points.
     * Rules:
     * - 61-90 points: 1 mark (standard win)
     * - 91-119 points: 2 marks (Capote)
     * - 120 points: Match Win (Bandeira) -> Effectively enough marks to win the match (4).
     *
     * @param int $winnerPoints
     * @return int Number of marks (0 if not a win, though input implies winner).
     */
    public static function calculateMarks(int $winnerPoints): int
    {
        if ($winnerPoints == 120) {
            return 4; // Bandeira - Wins match immediately (targets 4 marks)
        }
        if ($winnerPoints >= 91) {
            return 2; // Capote
        }
        if ($winnerPoints >= 61) {
            return 1; // Basic win
        }
        return 0; // Draw or loss? Should not happen if confirmed winner.
    }
}
