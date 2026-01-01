import { ref } from 'vue'
import { defineStore } from 'pinia'
import { useSocket } from '@/composables/useSocket.js'
import { useAPIStore } from './api'

export const useLobbyStore = defineStore('lobby', () => {
  const apiStore = useAPIStore()

  const { emit, on } = useSocket()

  const openGames = ref([]) // [{ gameId, creator, variant }]
  const openMatches = ref([]) // [{ matchId, creator, variant, stake }]

  const joinLobby = () => {
    emit('joinLobby') // optional server event if needed
  }

  // Setup listeners
  on('openGamesUpdated', (games) => {
    // console.log({ games })
    openGames.value = games
  })

  on('openMatchesUpdated', (matches) => {
    // console.log({ matches })
    openMatches.value = matches
  })

  const createGame = (variant = '9') => {
    return new Promise((resolve, reject) => {
      emit('createGame', { variant }, (res) => {
        if (res.error) reject(res.error)
        else resolve(res)
      })
    })
  }

  const createMatch = async (variant, stake) => {
    try {
      // 1. Create via API (handles money deduction)
      const res = await apiStore.createMatch(variant, stake)
      const matchesResponse = res.data
      const matchObj = matchesResponse.match || matchesResponse.data || matchesResponse

      console.log('Lobby: createMatch: API success, match ID:', matchObj.id)

      if (!matchObj.id) {
        throw new Error('API returned match without ID')
      }

      // 2. Notify Socket (creates room/state)
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('WebSocket timed out waiting for server response'))
        }, 5000)

        emit(
          'createMatch',
          {
            matchId: matchObj.id,
            variant: matchObj.type || variant,
            stake: matchObj.stake || stake,
          },
          (socketRes) => {
            clearTimeout(timeout)
            console.log('Lobby: createMatch: WebSocket response:', socketRes)
            if (socketRes && socketRes.error) reject(socketRes.error)
            else resolve({ matchId: matchObj.id })
          },
        )
      })
    } catch (err) {
      console.error('Lobby Store createMatch error:', err)
      if (err.response && err.response.data && err.response.data.error) {
        throw new Error(err.response.data.error)
      }
      throw err // propagate to UI
    }
  }

  const joinGame = (gameId) => {
    return new Promise((resolve, reject) => {
      emit('joinGame', { gameId }, (res) => {
        if (res.success) resolve(res)
        else reject(res.error)
      })
    })
  }

  const joinMatch = (matchId) => {
    return new Promise((resolve, reject) => {
      emit('joinMatch', { matchId }, (res) => {
        if (res.success) resolve(res)
        else reject(res.error)
      })
    })
  }

  const getCurrentUserCoins = (userId) => {
    return apiStore.getCurrentUserCoins(userId)
  }

  return {
    openMatches,
    openGames,
    joinLobby,
    createGame,
    createMatch,
    joinGame,
    joinMatch,
    getCurrentUserCoins,
  }
})
