// src/composables/useBiscaDeck.js
import { ref, computed } from 'vue'
import { dealCards } from '@/utils/deck.js'
import { HAND_SIZES } from '@/constants/bisca.js'

export function useBiscaDeck(variantRef) {
  const myHand = ref([])
  const opponentHand = ref([])
  const stock = ref([])
  const trumpCard = ref(null)
  const trumpSuit = ref(null)

  const handSize = computed(() => HAND_SIZES[variantRef.value])

  const initDeck = () => {
    const dealt = dealCards(variantRef.value)
    myHand.value = dealt.hand2 // Example: you are dealer
    opponentHand.value = dealt.hand1.map((c) => ({ ...c, isFaceUp: false }))
    stock.value = dealt.stock.map((card, i, arr) => ({
      ...card,
      isFaceUp: i === arr.length - 1, // Only trump visible at bottom
    }))
    trumpCard.value = dealt.trumpCard
    trumpSuit.value = dealt.trumpSuit
  }

  const drawCard = (playerHand) => {
    if (stock.value.length === 0) return null
    const card = stock.value.shift()
    playerHand.value.push({ ...card, isFaceUp: true })
    return card
  }

  return {
    myHand,
    opponentHand,
    stock,
    trumpCard,
    trumpSuit,
    handSize,
    initDeck,
    drawCard,
  }
}
