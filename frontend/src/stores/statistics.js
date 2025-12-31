import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAPIStore } from './api'

export const useStatisticsStore = defineStore('statistics', () => {
  const apiStore = useAPIStore()

  const publicStats = ref(null)
  const userStats = ref(null)
  const loading = ref(false)
  const error = ref('')

  const fetchPublicStatistics = async () => {
    loading.value = true
    error.value = ''
    try {
      const response = await apiStore.getPublicStatistics()
      publicStats.value = response.data
    } catch (err) {
      error.value = err?.response?.data?.message || 'Failed to fetch public statistics'
      publicStats.value = null
    } finally {
      loading.value = false
    }
  }


  const fetchUserStatistics = async () => {
    loading.value = true
    error.value = ''
    try {
      const response = await apiStore.getUserStatistics()
      userStats.value = response.data
    } catch (err) {
      error.value = err?.response?.data?.message || 'Failed to fetch user statistics'
      userStats.value = null
    } finally {
      loading.value = false
    }
  }

  return {
    publicStats,
    userStats,
    loading,
    error,
    fetchPublicStatistics,
    fetchUserStatistics,
  }
})
