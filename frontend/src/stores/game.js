// src/stores/useGameStore.js
import { ref } from 'vue'
import { defineStore } from 'pinia'
import { useSocket } from '@/composables/useSocket.js'

export const useGameStore = defineStore('game', () => {
  const { emit, on } = useSocket()

  // State
  const myHand = ref([])
  const opponentHandCount = ref(0)
  const stockCount = ref(0)
  const trumpCard = ref(null)
  const trumpSuit = ref('')
  const playedCards = ref({ player1: null, player2: null })
  const myPoints = ref(0)
  const opponentPoints = ref(0)
  const isMyTurn = ref(false)
  const timerSeconds = ref(20)
  const opponentNickname = ref('Waiting...')
  const gameId = ref(null)
  const youAre = ref(null)

  // Actions
  const playCard = (card) => {
    if (!isMyTurn.value || !gameId.value) return
    emit('playCard', { gameId: gameId.value, card: { suit: card.suit, rank: card.rank } })
  }

  const createGame = (variant = '9') => {
    return new Promise((resolve) => {
      emit(
        'createGame',
        {
          variant,
        },
        (res) => {
          resolve(res)
        },
      )
    })
  }

  const joinGame = (id) => {
    return new Promise((resolve, reject) => {
      emit('joinGame', { gameId: id }, (res) => {
        if (res.success) {
          gameId.value = id
          resolve()
        } else {
          reject(res.error)
        }
      })
    })
  }

  const resign = () => {
    if (!gameId.value) return
    emit('resign', { gameId: gameId.value })
  }

  const reset = () => {
    myHand.value = []
    opponentHandCount.value = 0
    stockCount.value = 0
    trumpCard.value = null
    trumpSuit.value = ''
    playedCards.value = { player1: null, player2: null }
    myPoints.value = 0
    opponentPoints.value = 0
    isMyTurn.value = false
    timerSeconds.value = 20
    opponentNickname.value = 'Waiting...'
    gameId.value = null
    youAre.value = null
  }

  // Setup all listeners once
  on('gameStarted', (data) => {
    myHand.value = data.yourHand || []
    opponentHandCount.value = data.opponentHandSize || 0
    stockCount.value = data.stockSize || 0
    trumpCard.value = { filename: data.trumpCardFilename }
    trumpSuit.value = data.trumpSuit
    youAre.value = data.youAre
    opponentNickname.value = 'Opponent'
  })

  on('opponentJoined', ({ nickname }) => {
    opponentNickname.value = nickname
  })

  on('turnStarted', ({ player, seconds }) => {
    isMyTurn.value = player === youAre.value
    timerSeconds.value = seconds
  })

  on('cardPlayed', ({ player, card }) => {
    const key = player === 'player1' ? 'player1' : 'player2'
    playedCards.value[key] = { ...card, isWinner: false }
  })

  on('cardDrawn', (card) => {
    myHand.value.push(card)
  })

  on('stockUpdated', ({ newStockSize }) => {
    stockCount.value = newStockSize
  })

  on('playerPointsUpdated', ({ player1Points, player2Points }) => {
    if (youAre.value === 'player1') {
      myPoints.value = player1Points
      opponentPoints.value = player2Points
    } else {
      myPoints.value = player2Points
      opponentPoints.value = player1Points
    }
  })

  on('gameEnded', ({ winner, points, reason }) => {
    alert(
      `Game Over! ${winner === youAre.value ? 'You win!' : opponentNickname.value + ' wins'} (${reason}), points: ${points}`,
    )
  })

  on('invalidMove', ({ reason }) => {
    alert('Invalid move: ' + reason)
  })

  return {
    myHand,
    opponentHandCount,
    stockCount,
    trumpCard,
    playedCards,
    myPoints,
    opponentPoints,
    isMyTurn,
    timerSeconds,
    opponentNickname,
    gameId,
    youAre,
    reset,
    playCard,
    createGame,
    joinGame,
    resign,
  }
})
