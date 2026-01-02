export const SUITS = ['CLUB', 'DIAMOND', 'HEART', 'SPADE']

export const RANKS = ['1', '2', '3', '4', '5', '6', '7', '11-JACK', '12-QUEEN', '13-KING']

export const CARD_POINTS = {
  1: 11,
  7: 10,
  '13-KING': 4,
  '11-JACK': 3,
  '12-QUEEN': 2,
}

export const HAND_SIZE = {
  3: 3,
  9: 9,
}

export const TIMER_SECONDS = 20

export const GAME_STATUS = {
  WAITING: 'waiting',
  PLAYING: 'playing',
  ENDED: 'ended',
}
