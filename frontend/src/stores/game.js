// src/stores/useGameStore.js
import { ref, inject } from 'vue'
import { defineStore } from 'pinia'


export const useGameStore = defineStore('game', () => {
  // Direct injection to avoid lifecycle cleanup issues from useSocket composable
  const socket = inject('socket')

  const emit = (event, data, callback) => {
    socket.emit(event, data, callback)
  }

  let timerInterval = null

  // Helper to prevent duplicate listeners if store is re-setup (though stores are singletons usually)
  const on = (event, handler) => {
    socket.off(event) // Clear previous to be safe
    socket.on(event, handler)
  }

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
  const status = ref('waiting')

  // Actions
  const playCard = (card) => {
    if (!isMyTurn.value || !gameId.value) return
    emit('playCard', { gameId: gameId.value, card: { suit: card.suit, rank: card.rank } }, (res) => {
      if (res && res.error) {
        alert(res.error)
      }
    })
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
    emit('resign', { gameId: gameId.value }, (res) => {
      if (res && res.error) alert(res.error)
    })
  }

  const reset = () => {
    if (timerInterval) clearInterval(timerInterval)
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
    status.value = 'waiting'
  }

  // Setup all listeners once
  // Since this store is a singleton, these will persist.
  // Note: We avoid useSocket() because it attaches onUnmounted() which kills listeners on route change.

  on('gameStarted', (data) => {
    console.log('[GameStore] Received gameStarted:', data)
    myHand.value = data.yourHand || []
    opponentHandCount.value = data.opponentHandSize || 0
    stockCount.value = data.stockSize || 0
    trumpCard.value = data.trumpCardFilename ? { filename: data.trumpCardFilename } : null
    trumpSuit.value = data.trumpSuit
    youAre.value = data.youAre

    // Use provided nickname or default based on scenario
    if (data.opponentNickname) {
      opponentNickname.value = data.opponentNickname
    } else {
      opponentNickname.value = 'Opponent' // Fallback for multiplayer
    }

    // Set turn immediately
    isMyTurn.value = data.firstTurn === data.youAre

    status.value = 'playing'
  })

  on('opponentJoined', ({ nickname }) => {
    console.log('[GameStore] Opponent joined:', nickname)
    opponentNickname.value = nickname
    status.value = 'playing'
  })

  on('turnStarted', ({ player, seconds }) => {
    isMyTurn.value = player === youAre.value
    timerSeconds.value = seconds

    // Clear existing timer if any
    if (timerInterval) clearInterval(timerInterval)

    // Start countdown
    timerInterval = setInterval(() => {
      if (timerSeconds.value > 0) {
        timerSeconds.value--
      } else {
        clearInterval(timerInterval)
      }
    }, 1000)
  })

  on('cardPlayed', ({ player, card }) => {
    const key = player === 'player1' ? 'player1' : 'player2'
    playedCards.value[key] = { ...card, isWinner: false }

    // If it was ME who played, remove from myHand
    if (player === youAre.value) {
      const idx = myHand.value.findIndex(
        (c) => c.suit === card.suit && c.rank === card.rank
      )
      if (idx !== -1) {
        myHand.value.splice(idx, 1)
      }
    }
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

  on('roundEnded', () => {
    playedCards.value = { player1: null, player2: null }
  })

  const gameOverData = ref(null)

  on('gameEnded', ({ winner, points, reason }) => {
    if (timerInterval) clearInterval(timerInterval)
    status.value = 'ended'
    gameOverData.value = { winner, points, reason }
    // No alert, UI should handle this
    console.log('Game Ended', { winner, points, reason })
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
    status,
    gameOverData,
    reset,
    playCard,
    createGame,
    joinGame,
    resign,
  }
})
