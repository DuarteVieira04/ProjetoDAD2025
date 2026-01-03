import { defineStore } from 'pinia'
import { ref, computed, inject } from 'vue'
import { useAPIStore } from './api'
import router from '@/router'
import axios from 'axios'

export const useAuthStore = defineStore('auth', () => {
  const API_BASE_URL = inject('apiBaseURL')

  const apiStore = useAPIStore()

  // Initialize from Local Storage
  const currentUser = ref(JSON.parse(localStorage.getItem('currentUser')) || undefined)
  const userCoins = ref(0)

  const isLoggedIn = computed(() => {
    return currentUser.value !== undefined
  })

  const currentUserID = computed(() => {
    return currentUser.value?.id
  })

  const socket = inject('socket')

  const register = async (payload) => {
    await axios.post(`${API_BASE_URL}/auth/register`, payload) // or apiStore.postRegister(payload) if exists

    await login({
      email: payload.email,
      password: payload.password,
    })

    return currentUser.value
  }

  const login = async (credentials) => {
    await apiStore.postLogin(credentials)
    const response = await apiStore.getAuthUser()
    const user = response.data
    if (user.photo_avatar_filename) {
      const baseUrl = API_BASE_URL.replace('/api', '')
      user.avatar_url = `${baseUrl}/storage/photos_avatars/${user.photo_avatar_filename}`
    }
    currentUser.value = user
    fetchUserCoins()

    // Save to Local Storage
    localStorage.setItem('currentUser', JSON.stringify(currentUser.value))

    // Reconnect socket to update auth
    socket.disconnect()
    socket.connect()

    return response.data
  }

  const isAdmin = () => currentUser?.value?.type === 'A'

  const fetchUserCoins = async () => {
    if (!isLoggedIn.value) return
    try {
      const response = await apiStore.getAuthUserCoinsBalance()
      userCoins.value = response.data.balance
      return response.data.balance
    } catch (error) {
      console.error('Error fetching user coins:', error)
    }
  }

  const logout = async () => {
    router.push({ path: '/' }) // ensurEe navigation
    await apiStore.postLogout()
    localStorage.removeItem('currentUser')
    localStorage.removeItem('authToken')
    currentUser.value = undefined
    userCoins.value = 0

    // Reconnect socket to clear auth
    socket.disconnect()
    socket.connect()
  }

  const deleteUser = async () => {
    await axios.delete(`${API_BASE_URL}/users/me/delete`)
  }

  return {
    currentUser,
    userCoins,
    isAdmin,
    isLoggedIn,
    currentUserID,
    login,
    logout,
    register,
    fetchUserCoins,
    deleteUser,
  }
})
