export const SUITS = ['CLUB', 'DIAMOND', 'HEART', 'SPADE']

export const SUIT_SYMBOLS = {
  CLUB: '♣',
  DIAMOND: '♦',
  HEART: '♥',
  SPADE: '♠',
}

export const SUIT_NAMES = {
  CLUB: 'paus',
  DIAMOND: 'ouros',
  HEART: 'copas',
  SPADE: 'espadas',
}

export const RANKS = ['1', '2', '3', '4', '5', '6', '7', '11-JACK', '12-QUEEN', '13-KING']

export const RANK_DISPLAY = {
  1: 'Ás',
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: 'Sete',
  '11-JACK': 'Valete',
  '12-QUEEN': 'Dama',
  '13-KING': 'Rei',
}

export const RANK_ORDER = {
  1: 10, // Ás ranks highest
  7: 9, // Sete (manilha)
  '13-KING': 8,
  '12-QUEEN': 7,
  '11-JACK': 6,
  6: 5,
  5: 4,
  4: 3,
  3: 2,
  2: 1,
}

// Point values as per Bisca rules
export const CARD_POINTS = {
  1: 11, // Ás
  7: 10, // Sete
  '13-KING': 4, // Rei
  '11-JACK': 3, // Valete
  '12-QUEEN': 2, // Dama
  // All others: 0
}

export const TOTAL_DECK_POINTS = 120

export const HAND_SIZES = {
  3: 3,
  9: 9,
}
