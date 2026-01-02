<template>
  <div class="space-y-6 mx-auto p-6 max-w-lg">
    <Button class="w-full" variant="outline" @click="$router.push('/shop/history')"
      >View Coin Transaction History</Button
    >
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
              :placeholder="paymentText"
              :maxlength="paymentMaxLength"
              @input="validateReference"
              required
            />
            <p v-if="referenceError" class="mt-1 text-red-500 text-sm">{{ referenceError }}</p>
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

          <label class="block pl-2 text-gray-500 text-sm italic">
            Each euro gives you 10 coins.
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
import { ref, computed } from 'vue'
import { useTransactionsStore } from '@/stores/transactions'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth'

const transactionsStore = useTransactionsStore()

const payment = ref({
  type: 'MBWAY',
  reference: '',
  value: 1,
})

const paymentText = computed(() => {
  switch (payment.value.type) {
    case 'MBWAY':
      return 'Enter your phone number'
    case 'PAYPAL':
      return 'Enter your PayPal email'
    case 'IBAN':
      return 'Enter your IBAN'
    case 'MB':
      return 'Enter your MB reference'
    case 'VISA':
      return 'Enter your VISA card number'
    default:
      return 'Enter your reference'
  }
})

const paymentPattern = computed(() => {
  switch (payment.value.type) {
    case 'MBWAY':
      return '^9[0-9]{8}$'
    case 'PAYPAL':
      return '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
    case 'IBAN':
      return '^[A-Z]{2}[0-9]{23}$'
    case 'MB':
      return '^[0-9]{5}-[0-9]{9}$'
    case 'VISA':
      return '^4[0-9]{15}$'
    default:
      return '.*'
  }
})

const paymentMaxLength = computed(() => {
  switch (payment.value.type) {
    case 'MBWAY':
      return 9
    case 'PAYPAL':
      return 100
    case 'IBAN':
      return 25
    case 'MB':
      return 15
    case 'VISA':
      return 16
    default:
      return undefined
  }
})

const validateReference = () => {
  const ref = payment.value.reference
  if (!ref) {
    referenceError.value = ''
    return
  }

  const patterns = {
    MBWAY: { regex: /^9[0-9]{0,8}$/, message: 'Must be 9 digits starting with 9' },
    PAYPAL: {
      regex: /^[a-zA-Z0-9._%+-]*@?[a-zA-Z0-9.-]*\.?[a-zA-Z]*$/,
      message: 'Must be a valid email',
    },
    IBAN: { regex: /^[A-Z]{0,2}[0-9]{0,23}$/, message: 'Must be 2 letters followed by 23 digits' },
    MB: { regex: /^[0-9]{0,5}-?[0-9]{0,9}$/, message: 'Must be 5 digits, hyphen, and 9 digits' },
    VISA: { regex: /^4[0-9]{0,15}$/, message: 'Must be 16 digits starting with 4' },
  }

  const pattern = patterns[payment.value.type]
  if (pattern && !pattern.regex.test(ref)) {
    referenceError.value = pattern.message
  } else {
    referenceError.value = ''
  }
}

const loading = ref(false)
const error = ref('')
const success = ref('')
const referenceError = ref('')
const authStore = useAuthStore()

const validateForm = () => {
  if (!payment.value.type) {
    error.value = 'Payment type is required.'
    return false
  }
  if (!payment.value.reference) {
    error.value = 'Reference is required.'
    return false
  }
  if (!payment.value.value || payment.value.value < 1 || payment.value.value > 99) {
    error.value = 'Amount must be between 1 and 99.'
    return false
  }
  return true
}

const submitPurchase = async () => {
  error.value = ''
  success.value = ''

  if (!validateForm()) return

  loading.value = true

  try {
    await transactionsStore.purchaseCoins(payment.value)
    await authStore.fetchUserCoins()
    success.value = `Purchase successful! You received ${payment.value.value * 10} coins.`
  } catch (err) {
    error.value = err?.response?.data?.message || 'Error processing purchase'
  } finally {
    loading.value = false
  }
}
</script>
