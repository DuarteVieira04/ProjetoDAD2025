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
}
