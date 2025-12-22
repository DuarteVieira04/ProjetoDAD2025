import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAPIStore } from './api'

export const useTransactionsStore = defineStore('transactions', () => {
  const apiStore = useAPIStore()

  const transactions = ref([])
  const loading = ref(false)
  const error = ref('')

  const getAuthUserCoinsTransactions = async () => {
    try {
      const response = await apiStore.getAuthUserCoinsTransactions()
      transactions.value = response.data
    } catch (err) {
      console.error('Error fetching transactions:', err)
      transactions.value = []
    }
  }

  const purchaseCoins = async ({ type, reference, value }) => {
    error.value = ''
    loading.value = true

    try {
      const payload = {
        type: String(type),
        reference: String(reference),
        value: parseInt(value),
      }

      const response = await apiStore.purchaseCoins(payload, {
        headers: { 'Content-Type': 'application/json' },
      })

      return response.data
    } catch (err) {
      console.error('Purchase failed:', err.response?.data || err)
      error.value = err?.response?.data?.message || 'Error processing purchase'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    transactions,
    loading,
    error,
    getAuthUserCoinsTransactions,
    purchaseCoins,
  }
})
