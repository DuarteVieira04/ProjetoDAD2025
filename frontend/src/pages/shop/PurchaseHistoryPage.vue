<template>
  <div class="space-y-6 mx-auto p-6 max-w-6xl">
    <Card>
      <CardHeader>
        <CardTitle>Purchase History</CardTitle>
        <CardDescription>View all your coin purchase transactions</CardDescription>
      </CardHeader>

      <CardContent>
        <div v-if="loading" class="flex justify-center items-center py-8">
          <p class="text-muted-foreground">Loading...</p>
        </div>

        <div v-else-if="!purchases || purchases.length === 0" class="py-8 text-center">
          <p class="text-muted-foreground">No purchases found.</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full border-collapse">
            <thead>
              <tr class="border-b">
                <th class="px-4 py-3 text-left font-semibold">Date</th>
                <th class="px-4 py-3 text-left font-semibold">Amount (€)</th>
                <th class="px-4 py-3 text-left font-semibold">Coins Received</th>
                <th class="px-4 py-3 text-left font-semibold">Payment Type</th>
                <th class="px-4 py-3 text-left font-semibold">Reference</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="purchase in purchases" 
                :key="purchase.id" 
                class="border-b hover:bg-muted/50 transition-colors"
              >
                <td class="px-4 py-3">{{ formatDate(purchase.purchase_datetime) }}</td>
                <td class="px-4 py-3">€{{ purchase.euros }}</td>
                <td class="px-4 py-3">{{ purchase.euros * 10 }} coins</td>
                <td class="px-4 py-3">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    {{ purchase.payment_type }}
                  </span>
                </td>
                <td class="px-4 py-3 font-mono text-sm">{{ purchase.payment_reference }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useTransactionsStore } from '@/stores/transactions'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

const transactionsStore = useTransactionsStore()

const purchases = ref([])
const loading = ref(true)

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('pt-PT', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

onMounted(async () => {
  loading.value = true
  await transactionsStore.getAuthUserPurchaseHistory()
  purchases.value = transactionsStore.purchases
  loading.value = false
})
</script>
