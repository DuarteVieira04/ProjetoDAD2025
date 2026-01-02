import {
  SUITS,
  RANKS,
  CARD_POINTS,
  SUIT_SYMBOLS,
  RANK_DISPLAY,
  HAND_SIZES,
} from '@/constants/bisca.js'

function getFilename(suit, rank) {
  return `${suit}-${rank}.svg`
}

function getCardValue(rank) {
  return CARD_POINTS[rank] || 0
}

// Fisher-Yates shuffle
export function shuffleDeck(deck) {
  const shuffled = [...deck]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function generateFullDeck() {
  const deck = []
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        suit,
        rank,
        filename: getFilename(suit, rank),
        value: getCardValue(rank),
        suitSymbol: SUIT_SYMBOLS[suit],
        rankDisplay: RANK_DISPLAY[rank],
        isFaceUp: true,
      })
    }
  }
  return deck
}

export function dealCards(variant = '9') {
  const handSize = HAND_SIZES[variant]
  if (!handSize) throw new Error('Invalid variant: use "3" or "9"')

  const fullDeck = generateFullDeck()
  const shuffled = shuffleDeck(fullDeck)

  const hand1 = shuffled.splice(0, handSize) // Non-dealer (leads first)
  const hand2 = shuffled.splice(0, handSize) // Dealer

  const stock = shuffled
  const trumpCard = stock[stock.length - 1] // Bottom card = trump (visible beneath pile)

  const sortHand = (hand) =>
    hand.sort((a, b) => {
      const suitDiff = SUITS.indexOf(a.suit) - SUITS.indexOf(b.suit)
      if (suitDiff !== 0) return suitDiff
      return RANKS.indexOf(a.rank) - RANKS.indexOf(b.rank)
    })

  return {
    hand1: sortHand(hand1),
    hand2: sortHand(hand2),
    stock,
    stockSize: stock.length,
    trumpCard,
    trumpSuit: trumpCard.suit,
    trumpSymbol: trumpCard.suitSymbol,
  }
}
