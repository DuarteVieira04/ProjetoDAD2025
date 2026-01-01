import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAPIStore } from './api'

export const useStatisticsStore = defineStore('statistics', () => {
  const apiStore = useAPIStore()

  const publicStats = ref(null)
  const userStats = ref(null)
  const adminStats = ref(null)
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

  const fetchAdminStatistics = async () => {
    loading.value = true
    error.value = ''
    try {
      const response = await apiStore.getAdminStatistics()
      adminStats.value = response.data
    } catch (err) {
      error.value = err?.response?.data?.message || 'Failed to fetch admin statistics'
      adminStats.value = null
    } finally {
      loading.value = false
    }
  }

  return {
    publicStats,
    userStats,
    adminStats,
    loading,
    error,
    fetchPublicStatistics,
    fetchUserStatistics,
    fetchAdminStatistics,
  }
})
