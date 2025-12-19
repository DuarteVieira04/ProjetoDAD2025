import { defineStore } from 'pinia'
import axios from 'axios'
import { computed, inject, ref } from 'vue'

export const useAPIStore = defineStore('api', () => {
  const API_BASE_URL = inject('apiBaseURL')

  const token = ref()
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
  const postLogin = async (credentials) => {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials)
    token.value = response.data.token
    console.log({ 'postLogin token': token.value })
    axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
  }
  const postLogout = async () => {
    await axios.post(`${API_BASE_URL}/auth/logout`)
    token.value = undefined
    delete axios.defaults.headers.common['Authorization']
  }

  // Users
  const getAuthUser = () => {
    return axios.get(`${API_BASE_URL}/users/me`)
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

  return {
    token,
    getToken,
    postLogin,
    postLogout,
    getAuthUser,
    getGames,
    gameQueryParameters,
  }
})
