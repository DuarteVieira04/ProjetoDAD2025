<template>
  <div class="space-y-6 mx-auto p-6 max-w-6xl">
    <Card>
      <CardHeader>
        <CardTitle>Coin Transaction History</CardTitle>
        <CardDescription>View all your coin transactions</CardDescription>
      </CardHeader>

      <CardContent class="space-y-6">
        <div class="space-y-3">
          <label class="block font-semibold text-sm">Filter by Type</label>
          <div class="flex flex-wrap gap-2">
            <button
              @click="selectedType = null"
              :class="[
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                selectedType === null
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80',
              ]"
            >
              All Transactions
            </button>
            <button
              v-for="type in availableTypes"
              :key="type"
              @click="selectedType = type"
              :class="[
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                selectedType === type
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80',
              ]"
            >
              {{ type }}
            </button>
          </div>
        </div>
        <div v-if="loading" class="flex justify-center items-center py-8">
          <p class="text-muted-foreground">Loading...</p>
        </div>
        <div
          v-else-if="!filteredTransactions || filteredTransactions.length === 0"
          class="py-8 text-center"
        >
          <p class="text-muted-foreground">No transactions found.</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full border-collapse">
            <thead>
              <tr class="border-b">
                <th class="px-4 py-3 font-semibold text-left">Date</th>
                <th class="px-4 py-3 font-semibold text-left">Transaction Type</th>
                <th class="px-4 py-3 font-semibold text-left">Coins</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="transaction in filteredTransactions"
                :key="transaction.id"
                class="hover:bg-muted/50 border-b transition-colors"
              >
                <td class="px-4 py-3">{{ formatDate(transaction.transaction_datetime) }}</td>
                <td class="px-4 py-3">
                  <span
                    class="inline-flex items-center bg-primary/10 px-2.5 py-0.5 rounded-full font-medium text-primary text-xs"
                  >
                    {{ transaction.type?.name || 'Unknown' }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <span
                    :class="transaction.coins > 0 ? 'text-green-600' : 'text-red-600'"
                    class="font-semibold"
                  >
                    {{ transaction.coins > 0 ? '+' : '' }}{{ transaction.coins }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useTransactionsStore } from '@/stores/transactions'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

const transactionsStore = useTransactionsStore()

const transactions = ref([])
const selectedType = ref(null)
const loading = ref(true)

const availableTypes = computed(() => {
  const types = new Set()
  transactions.value.forEach((t) => {
    if (t.type?.name) {
      types.add(t.type.name)
    }
  })
  return Array.from(types).sort()
})

const filteredTransactions = computed(() => {
  if (!selectedType.value) {
    return transactions.value
  }
  return transactions.value.filter((t) => t.type?.name === selectedType.value)
})

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('pt-PT', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

onMounted(async () => {
  loading.value = true
  await transactionsStore.getAuthUserCoinsTransactions()
  transactions.value = transactionsStore.transactions
  loading.value = false
})
</script>
