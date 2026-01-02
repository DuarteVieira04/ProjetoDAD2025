// stores/match.js
import axios from 'axios'
import { defineStore } from 'pinia'
import { inject, ref, computed } from 'vue'

export const useMatchStore = defineStore('match', () => {
  const API_BASE_URL = inject('apiBaseURL')

  // State
  const matches = ref([]) // array of matches
  const loading = ref(false) // loading state
  const error = ref(null) // error state

  // Getters
  const getMatches = computed(() => matches.value)

  const hasMatches = computed(() => matches.value.length > 0)

  // Actions
  const fetchMatches = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await axios.get(`${API_BASE_URL}/matches`)
      // Assuming the API returns { data: [...] } or just [...]
      matches.value = Array.isArray(response.data) ? response.data : []
    } catch (err) {
      error.value = err.message || 'Failed to fetch matches'
      console.error('Error fetching matches:', err)
      matches.value = []
    } finally {
      loading.value = false
    }
  }

  return {
    matches,
    loading,
    error,

    getMatches,
    hasMatches,

    fetchMatches,
  }
})
