import { getCardStrength, getCardValue } from "../utils/cards.js";
import { pickRandomValidCard } from "../utils/game_helpers.js";

function getWinningCards(hand, leadCard, trumpSuit) {
    const winningCards = [];
    const leadSuit = leadCard.suit;

    for (const card of hand) {
        if (card.suit === leadSuit) {
            // Must have higher strength to win same suit
            if (getCardStrength(card.rank) > getCardStrength(leadCard.rank)) {
                winningCards.push(card);
            }
        } else if (card.suit === trumpSuit) {
            // Trump always wins against non-trump lead
            if (leadSuit !== trumpSuit) {
                winningCards.push(card);
            }
        }
    }
    return winningCards;
}

export function calculateBotMove(game, botPlayerKey) {
    const hand = game.hands[botPlayerKey];
    if (!hand || hand.length === 0) return null;

    if (game.currentTrick.length === 0) {
        // LEADING:
        // Strategy: Play random valid card for now.
        return pickRandomValidCard(game, botPlayerKey);
    } else {
        // FOLLOWING:
        const trickCard = game.currentTrick[0].card;

        // 1. Identify valid cards (must follow suit if possible)
        const sameSuitCards = hand.filter(c => c.suit === trickCard.suit);
        const validCards = sameSuitCards.length > 0 ? sameSuitCards : hand;

        // 2. Can we win?
        let possibleWinners = [];

        if (sameSuitCards.length > 0) {
            // Must play same suit.
            possibleWinners = sameSuitCards.filter(c => getCardStrength(c.rank) > getCardStrength(trickCard.rank));
        } else {
            // Can play any card.
            if (trickCard.suit === game.trumpSuit) {
                // Opponent led Trump. We have no Trump.
                possibleWinners = [];
            } else {
                // Opponent led non-trump. We have none of that suit.
                // We can win with ANY trump.
                possibleWinners = hand.filter(c => c.suit === game.trumpSuit);
            }
        }

        if (possibleWinners.length > 0) {
            // Win with the lowest strength card possible
            possibleWinners.sort((a, b) => getCardStrength(a.rank) - getCardStrength(b.rank));
            return possibleWinners[0];
        } else {
            // Cannot win. Play lowest strength card from VALID cards.
            validCards.sort((a, b) => getCardStrength(a.rank) - getCardStrength(b.rank));
            return validCards[0];
        }
    }
}
