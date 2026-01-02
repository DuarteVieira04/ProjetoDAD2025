import { CARD_POINTS } from '../constants/index.js'

export function getCardValue(rank) {
  return CARD_POINTS[rank] || 0
}

export function getCardStrength(rank) {
  const strengthMap = {
    1: 120,
    7: 110,
    '13-KING': 100,
    '11-JACK': 90,
    '12-QUEEN': 80,
    6: 60,
    5: 50,
    4: 40,
    3: 30,
    2: 20,
  }
  return strengthMap[rank] || 0
}
