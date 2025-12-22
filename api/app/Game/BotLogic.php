<?php

namespace App\Game;

use Illuminate\Support\Collection;

class BotLogic
{
    /**
     * Decides which card the bot plays.
     *
     * @param Collection $hand The bot's current hand (Collection of Card).
     * @param Card|null $opponentCard The card played by the opponent (null if bot leads).
     * @param BiscaSuit $trumpSuit The trump suit.
     * @param bool $canFollowSuit (Optional for future strict rules, usually false in Bisca unless deck empty)
     * @return Card The card to play.
     */
    public static function chooseCard(Collection $hand, ?Card $opponentCard, BiscaSuit $trumpSuit): Card
    {
        // 1. If Bot leads (opponentCard is null)
        if (!$opponentCard) {
            // Simple strategy: Play the lowest value card to save points? 
            // Or play a high card to force? 
            // Requirements say: "when playing second... attempt to win; if it cannot, plays lowest."
            // It doesn't specify strategy for leading.
            // Let's play the absolute lowest power card to be safe/conservative.
            return self::getLowestPowerCard($hand, $trumpSuit);
        }

        // 2. If Bot plays second
        // "attempt to win"

        // Try to find a winning card
        $winningCards = $hand->filter(function (Card $card) use ($opponentCard, $trumpSuit) {
            return BiscaGameLogic::calculateTrickWinner($opponentCard, $card, $trumpSuit) === 2;
        });

        if ($winningCards->isNotEmpty()) {
            // "attempt to win". Which one? 
            // Usually, win with the cheapest card possible to save high trumps?
            // Or win with the highest necessary?
            // Let's pick the lowest power winning card (most efficient win).
            return self::getLowestPowerCard($winningCards, $trumpSuit);
        }

        // "if it cannot, it plays its lowest-value card"
        return self::getLowestPowerCard($hand, $trumpSuit);
    }

    private static function getLowestPowerCard(Collection $cards, BiscaSuit $trumpSuit): Card
    {
        // Sort by power. Trumps effectively have higher utility, but "value" usually means points or power.
        // Let's sort by: Non-Trumps < Trumps. Then by Power.

        return $cards->sort(function (Card $a, Card $b) use ($trumpSuit) {
            $isTrumpA = $a->suit === $trumpSuit;
            $isTrumpB = $b->suit === $trumpSuit;

            if ($isTrumpA !== $isTrumpB) {
                return $isTrumpA ? 1 : -1; // Trumps are "higher", so we want them last (we want lowest first)
            }

            // Same status (both trump or both non-trump). Compare logical power.
            return self::getCardPower($a->rank) <=> self::getCardPower($b->rank);
        })->first();
    }

    private static function getCardPower(BiscaRank $rank): int
    {
        // Reusing power logic. 
        // Ideally this should be in BiscaRank or BiscaGameLogic public method to avoid duplication.
        // For now, I'll duplicate for speed, or refactor later.
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
