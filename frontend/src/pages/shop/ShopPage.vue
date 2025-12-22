<template>
  <div class="space-y-6 mx-auto p-6 max-w-lg">
    <Card>
      <CardHeader>
        <CardTitle>Purchase Coins</CardTitle>
        <CardDescription>Buy coins to play multiplayer games or matches</CardDescription>
      </CardHeader>

      <CardContent>
        <div class="space-y-4">
          <label class="block">
            Payment Type
            <select v-model="payment.type" class="p-2 border rounded w-full">
              <option value="MBWAY">MBWAY</option>
              <option value="PAYPAL">PAYPAL</option>
              <option value="IBAN">IBAN</option>
              <option value="MB">MB</option>
              <option value="VISA">VISA</option>
            </select>
          </label>

          <label class="block">
            Reference
            <input
              v-model="payment.reference"
              type="text"
              class="p-2 border rounded w-full"
              placeholder="Enter payment reference"
            />
          </label>

          <label class="block">
            Amount (€)
            <input
              v-model.number="payment.value"
              type="number"
              min="1"
              max="99"
              class="p-2 border rounded w-full"
            />
          </label>

          <Button @click="submitPurchase" :loading="loading">Buy Coins</Button>

          <p v-if="error" class="text-red-500">{{ error }}</p>
          <p v-if="success" class="text-green-500">{{ success }}</p>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useTransactionsStore } from '@/stores/transactions'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const transactionsStore = useTransactionsStore()

const payment = ref({
  type: 'MBWAY',
  reference: '',
  value: 1,
})

const loading = ref(false)
const error = ref('')
const success = ref('')

const submitPurchase = async () => {
  error.value = ''
  success.value = ''
  loading.value = true

  try {
    await transactionsStore.purchaseCoins(payment.value)
    success.value = `Purchase successful! You received ${payment.value.value * 10} coins.`
  } catch (err) {
    error.value = err?.response?.data?.message || 'Error processing purchase'
  } finally {
    loading.value = false
  }
}
</script>
