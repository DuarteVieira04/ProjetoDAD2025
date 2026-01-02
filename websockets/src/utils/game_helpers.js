/**
 * Utility functions for game logic.
 */

/**
 * Picks a random VALID card from the player's hand.
 * @param {Object} game - The game object.
 * @param {string} playerKey - 'player1' or 'player2'.
 * @returns {Object|null} The chosen card object or null if hand empty.
 */
export function pickRandomValidCard(game, playerKey) {
  const hand = game.hands[playerKey]
  if (!hand || hand.length === 0) return null

  let validCards = []

  if (game.currentTrick.length === 0) {
    // Leading: Any card is valid
    validCards = hand
  } else {
    // Following
    const trickCard = game.currentTrick[0].card
    const sameSuitCards = hand.filter((c) => c.suit === trickCard.suit)

    // If we have cards of the same suit, we MUST play one of them (Bisca/Sueca rules typically)
    // If not, we can play any card.
    if (sameSuitCards.length > 0) {
      validCards = sameSuitCards
    } else {
      validCards = hand
    }
  }

  if (validCards.length === 0) return null // Should not happen if hand not empty

  const randomIndex = Math.floor(Math.random() * validCards.length)
  return validCards[randomIndex]
}
