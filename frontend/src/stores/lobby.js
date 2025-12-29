import { ref } from 'vue'
import { defineStore } from 'pinia'
import { useSocket } from '@/composables/useSocket.js'
import { useAPIStore } from './api'

export const useLobbyStore = defineStore('lobby', () => {

  const apiStore = useAPIStore()

  const { emit, on } = useSocket()

  const openGames = ref([]) // [{ gameId, creator, variant }]

  const joinLobby = () => {
    emit('joinLobby') // optional server event if needed
  }

  // Setup listeners
  on('openGamesUpdated', (games) => {
    console.log({ games })
    openGames.value = games
  })

  const createGame = (variant = '9') => {
    return new Promise((resolve) => {
      emit('createGame', { variant }, (res) => {
        resolve(res)
      })
    })
  }

  const joinGame = (gameId) => {
    return new Promise((resolve, reject) => {
      emit('joinGame', { gameId }, (res) => {
        if (res.success) resolve()
        else reject(res.error)
      })
    })
  }

  const getCurrentUserCoins = (userId) => {
    return apiStore.getCurrentUserCoins(userId)
  }

  return {
    openGames,
    joinLobby,
    createGame,
    joinGame,
    getCurrentUserCoins,
  }
})
