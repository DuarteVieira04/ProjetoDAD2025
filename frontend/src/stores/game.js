import { ref, inject, computed } from 'vue'
import { defineStore } from 'pinia'
import { useAuthStore } from './auth'
import { toast } from 'vue-sonner'

export const useGameStore = defineStore('game', () => {
  const socket = inject('socket')

  const emit = (event, data, callback) => {
    socket.emit(event, data, callback)
  }

  const on = (event, handler) => {
    socket.off(event) // Prevent duplicate listeners
    socket.on(event, handler)
  }

  let timerInterval = null

  const stopTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
  }

  // Core state
  const currentId = ref(null) // matchId or gameId
  const type = ref(null) // 'match' or 'game'
  const status = ref('waiting') // waiting | playing | ended

  const myHand = ref([])
  const opponentHandCount = ref(0)
  const stockCount = ref(40)
  const trumpCard = ref(null)

  const playedCards = ref({ player1: null, player2: null })

  const myPoints = ref(0)
  const opponentPoints = ref(0)

  const isMyTurn = ref(false)
  const timerSeconds = ref(20)
  const turnTimeLimit = ref(20)

  const opponentNickname = ref('Waiting...')
  const youAre = ref(null) // 'player1' or 'player2'

  const stake = ref(0)
  const marks = ref({ you: 0, opponent: 0 })

  const gameOverData = ref(null)

  // Computed for UI convenience
  const myFinalPoints = computed(() => {
    if (!gameOverData.value?.points) return 0
    return gameOverData.value.points[youAre.value] ?? 0
  })

  const opponentFinalPoints = computed(() => {
    if (!gameOverData.value?.points) return 0
    const opp = youAre.value === 'player1' ? 'player2' : 'player1'
    return gameOverData.value.points[opp] ?? 0
  })

  const isMatch = computed(() => type.value === 'match')
  const isGameOver = computed(() => status.value === 'ended')

  const myMarks = computed(() => marks.value.you)
  const opponentMarks = computed(() => marks.value.opponent)

  // Game ready when we have hand + trump + playing status
  const gameReady = computed(
    () =>
      status.value === 'playing' &&
      myHand.value.length > 0 &&
      trumpCard.value !== null &&
      youAre.value !== null,
  )

  // Actions
  const playCard = (card) => {
    if (!isMyTurn.value || !currentId.value) return

    emit(
      'playCard',
      {
        gameId: currentId.value,
        card: { suit: card.suit, rank: card.rank },
      },
      (res) => {
        if (res?.error) toast.error(res.error)
      },
    )
  }

  const resign = () => {
    if (!currentId.value) return
    emit('resign', { gameId: currentId.value })
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

  const joinGame = (gameId) => {
    return new Promise((resolve, reject) => {
      emit('joinGame', { gameId }, (res) => {
        if (res.success) {
          currentId.value = gameId
          type.value = 'game'
          status.value = 'playing'
          resolve()
        } else {
          reject(res.error || 'Failed to join game')
        }
      })
    })
  }

  const joinMatch = (matchId) => {
    return new Promise((resolve, reject) => {
      emit('joinMatch', { matchId }, (res) => {
        if (res.success) {
          currentId.value = matchId
          type.value = 'match'
          status.value = 'playing'
          resolve()
        } else {
          reject(res.error || 'Failed to join match')
        }
      })
    })
  }

  const reset = () => {
    stopTimer()

    currentId.value = null
    type.value = null
    status.value = 'waiting'

    myHand.value = []
    opponentHandCount.value = 0
    stockCount.value = 40
    trumpCard.value = null

    playedCards.value = { player1: null, player2: null }

    myPoints.value = 0
    opponentPoints.value = 0

    isMyTurn.value = false
    timerSeconds.value = 20
    turnTimeLimit.value = 20

    opponentNickname.value = 'Waiting...'
    youAre.value = null

    stake.value = 0
    marks.value = { you: 0, opponent: 0 }

    gameOverData.value = null
  }

  // === Socket Listeners ===

  on('opponentJoined', ({ nickname }) => {
    opponentNickname.value = nickname
  })

  on('matchStarted', ({ stake: matchStake }) => {
    stake.value = matchStake
  })

  on('gameStarted', (data) => {
    opponentHandCount.value = data.opponentHandSize || 0
    stockCount.value = data.stockSize || 40
    trumpCard.value = data.trumpCard
    youAre.value = data.youAre
    myHand.value = data.yourHand
    opponentNickname.value = data.opponentNickname || 'Opponent'
    isMyTurn.value = data.firstTurn === data.youAre
    status.value = 'playing'
  })

  // In your socket listener setup (probably in useGameStore or socket init)
  on('gameStartedPrivate', (data) => {
    if (!data || !data.youAre) {
      console.warn('[GameStore] Invalid gameStartedPrivate payload')
      return
    }

    youAre.value = data.youAre
    myHand.value = data.yourHand
    opponentHandCount.value = data.opponentHandSize
    opponentNickname.value = data.opponentNickname || 'Opponent'
    trumpCard.value = data.trumpCard
    stockCount.value = Number(data.stockSize) || 0
    isMyTurn.value = data.firstTurn === data.youAre
    status.value = 'playing'
  })

  on('turnStarted', ({ player, seconds = 20 }) => {
    isMyTurn.value = player === youAre.value
    timerSeconds.value = seconds
    turnTimeLimit.value = seconds

    stopTimer()

    timerInterval = setInterval(() => {
      if (timerSeconds.value > 0) {
        timerSeconds.value--
      } else {
        stopTimer()
      }
    }, 1000)
  })

  on('cardPlayed', ({ player, card }) => {
    const key = player === 'player1' ? 'player1' : 'player2'
    playedCards.value = {
      ...playedCards.value,
      [key]: { ...card, isWinner: false },
    }

    // Remove from my hand if I played
    if (player === youAre.value) {
      const idx = myHand.value.findIndex((c) => c.suit === card.suit && c.rank === card.rank)
      if (idx !== -1) myHand.value.splice(idx, 1)
    }

    // Update opponent hand count
    if (player !== youAre.value) {
      opponentHandCount.value = Math.max(0, opponentHandCount.value - 1)
    }
  })

  on('cardDrawn', (card) => {
    myHand.value.push(card)
    // Re-sort after draw
    myHand.value.sort((a, b) => {
      if (a.suit !== b.suit) return a.suit.localeCompare(b.suit)
      return b.rank - a.rank
    })
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

  on('marksUpdated', ({ currentMarks }) => {
    if (isMatch.value && currentMarks) {
      marks.value = {
        you: youAre.value === 'player1' ? currentMarks.player1 : currentMarks.player2,
        opponent: youAre.value === 'player1' ? currentMarks.player2 : currentMarks.player1,
      }
    }
  })

  on('roundEnded', ({ winner }) => {
    if (winner) {
      const key = winner === 'player1' ? 'player1' : 'player2'
      if (playedCards.value[key]) {
        playedCards.value[key].isWinner = true
      }
    }

    setTimeout(() => {
      playedCards.value = { player1: null, player2: null }
    }, 1500)
  })

  on('gameEnded', ({ winner, points, reason }) => {
    stopTimer()
    status.value = 'ended'
    gameOverData.value = { winner, points, reason }

    // Refresh coins
    const authStore = useAuthStore()
    authStore.fetchUserCoins()
  })

  on('matchEnded', ({ winner, finalMarks, reason }) => {
    stopTimer()
    status.value = 'ended'
    gameOverData.value = { winner, points: null, reason: reason || 'Match completed' }

    if (finalMarks) {
      marks.value = {
        you:
          youAre.value === winner
            ? finalMarks[winner]
            : finalMarks[youAre.value === 'player1' ? 'player2' : 'player1'],
        opponent:
          youAre.value === winner
            ? finalMarks[youAre.value === 'player1' ? 'player2' : 'player1']
            : finalMarks[winner],
      }
    }

    // Refresh coins
    const authStore = useAuthStore()
    authStore.fetchUserCoins()
  })

  on('invalidMove', ({ reason }) => {
    toast.error('Invalid move: ' + reason)
  })

  on('disconnect', () => {
    stopTimer()
    status.value = 'waiting'
    opponentNickname.value = 'Waiting...'
    console.warn('[GameStore] Socket disconnected')
  })

  return {
    // State
    currentId,
    type,
    status,
    myHand,
    opponentHandCount,
    stockCount,
    trumpCard,
    playedCards,
    myPoints,
    opponentPoints,
    isMyTurn,
    timerSeconds,
    turnTimeLimit,
    opponentNickname,
    youAre,
    stake,
    marks,
    gameOverData,

    // Computed
    myFinalPoints,
    opponentFinalPoints,
    myMarks,
    opponentMarks,
    isMatch,
    isGameOver,
    gameReady,

    // Actions
    playCard,
    resign,
    createGame,
    joinGame,
    joinMatch,
    reset,
  }
})
