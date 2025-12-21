import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAPIStore } from './api'
import router from '@/router'

export const useAuthStore = defineStore('auth', () => {
  const apiStore = useAPIStore()

  const currentUser = ref(JSON.parse(localStorage.getItem('currentUser')) || undefined)

  const isLoggedIn = computed(() => {
    return currentUser.value !== undefined
  })

  const currentUserID = computed(() => {
    return currentUser.value?.id
  })

  const login = async (credentials) => {
    await apiStore.postLogin(credentials)
    const response = await apiStore.getAuthUser()
    currentUser.value = response.data
    localStorage.setItem('currentUser', JSON.stringify(currentUser.value))

    return response.data
  }

  const isAdmin = () => currentUser?.value?.type === 'A'

  const getUser = async () => {
    const response = await apiStore.getAuthUser()
    currentUser.value = response.data
  }

  const logout = async () => {
    router.push({ path: '/' }) // ensure navigation
    await apiStore.postLogout()
    currentUser.value = undefined
  }

  return {
    currentUser,
    isAdmin,
    isLoggedIn,
    currentUserID,
    login,
    logout,
  }
})
