import { ref, onMounted, onUnmounted } from 'vue'
import { useAPIStore } from '@/stores/api'

export function useCoins(options = {}) {
  const { pollMs = 0, refreshOnVisibility = true } = options

  const api = useAPIStore()
  const coins = ref(0)
  let pollTimer = undefined

  const refresh = async () => {
    try {
      const response = await api.getAuthUserCoinsBalance()
      coins.value = response.data.balance ?? 0
    } catch (err) {
      // If unauthorized or non-JSON occurs, keep current value
      // Consumers can decide to surface errors as needed
      console.error('[useCoins] Failed to refresh coins:', err)
    }
  }

  const startPolling = (intervalMs = pollMs) => {
    if (!intervalMs || intervalMs <= 0) return
    stopPolling()
    pollTimer = setInterval(refresh, intervalMs)
  }

  const stopPolling = () => {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = undefined
    }
  }

  const handleVisibility = () => {
    if (document.visibilityState === 'visible' && refreshOnVisibility) {
      refresh()
    }
  }

  onMounted(() => {
    refresh()
    if (refreshOnVisibility && typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibility)
    }
    startPolling()
  })

  onUnmounted(() => {
    stopPolling()
    if (refreshOnVisibility && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  })

  return { coins, refresh, startPolling, stopPolling }
}
