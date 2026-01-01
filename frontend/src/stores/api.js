import { defineStore } from 'pinia'
import axios from 'axios'
import { computed, inject, ref } from 'vue'

export const useAPIStore = defineStore('api', () => {
  const API_BASE_URL = inject('apiBaseURL')

  // Load token from localStorage on initialization
  const token = ref(localStorage.getItem('authToken'))
  if (token.value) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
  }

  const gameQueryParameters = ref({
    page: 1,
    filters: {
      type: '',
      status: '',
      sort_by: 'began_at',
      sort_direction: 'desc',
    },
  })

  const getToken = () => token.value

  // AUTH
  const setToken = (newToken) => {
    token.value = newToken
    localStorage.setItem('authToken', newToken)
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
  }

  const postLogin = async (credentials) => {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials)
    setToken(response.data.token)
  }
  const postLogout = async () => {
    await axios.post(`${API_BASE_URL}/auth/logout`)
    token.value = undefined
    localStorage.removeItem('authToken')
    localStorage.removeItem('currentUser')
    delete axios.defaults.headers.common['Authorization']
  }

  // Users
  const getAuthUser = () => {
    return axios.get(`${API_BASE_URL}/users/me`)
  }

  const getCurrentUserCoins = (userId) => {
    return axios.get(`${API_BASE_URL}/coins/balance/${userId}`)
  }

  const createMatch = (variant, stake) => {
    // API expects a proper payload? Let's assume params match MatchController::create
    // MatchController::create usually expects data in body.
    return axios.post(`${API_BASE_URL}/matches`, {
      type: variant,
      mode: 'multi',
      stake: parseInt(stake),
    })
  }

  //Games
  const getGames = (resetPagination = false) => {
    if (resetPagination) {
      gameQueryParameters.value.page = 1
    }

    // const queryParams = new URLSearchParams({
    //   page: gameQueryParameters.value.page,
    //   ...(gameQueryParameters.value.filters.type && {
    //     type: gameQueryParameters.value.filters.type,
    //   }),
    //   ...(gameQueryParameters.value.filters.status && {
    //     status: gameQueryParameters.value.filters.status,
    //   }),
    //   sort_by: gameQueryParameters.value.filters.sort_by,
    //   sort_direction: gameQueryParameters.value.filters.sort_direction,
    // }).toString()
    return axios.get(`${API_BASE_URL}/games`)
  }

  //Transactions
  const getAuthUserCoinsTransactions = () => axios.get(`${API_BASE_URL}/coins/transaction`)
  const getUserCoinsTransactions = (userId) => axios.get(`${API_BASE_URL}/coins/test`, { params: { id: userId } })
  const getAuthUserPurchaseHistory = () => axios.get(`${API_BASE_URL}/coins/purchases`)
  const purchaseCoins = (payload) => axios.post(`${API_BASE_URL}/coins/purchase`, payload)
  const getAuthUserCoinsBalance = () => axios.get(`${API_BASE_URL}/coins/balance`)

  //Statistics
  const getPublicStatistics = () => axios.get(`${API_BASE_URL}/statistics/public`)
  const getUserStatistics = () => axios.get(`${API_BASE_URL}/statistics/me`)
  const getAdminStatistics = () => axios.get(`${API_BASE_URL}/statistics`)

  // Leaderboards
  const getGlobalLeaderboard = (limit = 50) => axios.get(`${API_BASE_URL}/leaderboards/global`, { params: { limit } })
  const getPersonalLeaderboard = (params = {}) => axios.get(`${API_BASE_URL}/leaderboards/personal`, { params })

  // Match History
  const getUserMatchHistory = () => axios.get(`${API_BASE_URL}/matches/history/my`)
  const getAllMatchHistory = () => axios.get(`${API_BASE_URL}/matches/history/all`)
  const getMatchDetails = (matchId) => axios.get(`${API_BASE_URL}/matches/${matchId}/details`)

  return {
    token,
    getToken,
    postLogin,
    postLogout,
    getAuthUser,
    getGames,
    gameQueryParameters,
    getAuthUserCoinsTransactions,
    getUserCoinsTransactions,
    getAuthUserPurchaseHistory,
    purchaseCoins,
    getAuthUserCoinsBalance,
    getCurrentUserCoins,
    createMatch,
    getPublicStatistics,
    getUserStatistics,
    getAdminStatistics,
    getGlobalLeaderboard,
    getPersonalLeaderboard,
    getUserMatchHistory,
    getAllMatchHistory,
    getMatchDetails,
  }
})

