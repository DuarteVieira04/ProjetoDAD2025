<template>
  <div class="space-y-6 mx-auto p-6 max-w-3xl">
    <Card>
      <CardHeader>
        <div class="flex items-center justify-between w-full">
          <div>
            <CardTitle>My Leaderboard</CardTitle>
            <CardDescription>Your multiplayer stats</CardDescription>
          </div>
          <div class="flex items-center gap-3">
            <label class="text-sm">Variant:</label>
            <select v-model="variant" @change="fetch" class="p-2 border rounded">
              <option value="both">Both</option>
              <option value="3">3</option>
              <option value="9">9</option>
            </select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div v-if="loading" class="py-8 text-center">Loading...</div>
        <div v-else>
          <div v-if="error" class="text-red-600 mb-4">{{ error }}</div>

          <table class="w-full table-auto">
            <thead>
              <tr class="text-left">
                <th class="px-2 py-2">Name</th>
                <th class="px-2 py-2">Game Wins</th>
                <th class="px-2 py-2">Match Wins</th>
                <th class="px-2 py-2">Capotes</th>
                <th class="px-2 py-2">Bandeiras</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-t">
                <td class="px-2 py-2">
                  <span :class="{ 'font-bold italic': displayName === '(Anonymous User)' }">{{ displayName }}</span>
                </td>
                <td class="px-2 py-2 whitespace-nowrap">{{ data.game_wins }}</td>
                <td class="px-2 py-2 whitespace-nowrap">{{ data.match_wins }}</td>
                <td class="px-2 py-2">{{ data.capotes }}</td>
                <td class="px-2 py-2">{{ data.bandeiras }}</td>
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
import { useAPIStore } from '@/stores/api'
import { useAuthStore } from '@/stores/auth'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

const api = useAPIStore()
const auth = useAuthStore()

const data = ref({ game_wins: 0, match_wins: 0, capotes: 0, bandeiras: 0 })
const loading = ref(false)
const error = ref(null)
const raw = ref(null)
const variant = ref('both')

const displayName = computed(() => (data.value.name || data.value.nickname || '(Anonymous User)'))

const fetch = async () => {
  loading.value = true
  error.value = null
  try {
    const params = {}
    if (variant.value !== 'both') params.variant = variant.value
    const res = await api.getPersonalLeaderboard(params)
    raw.value = res
    if (!res || !res.data) {
      error.value = 'Empty response from server'
      console.error('Empty personal leaderboard response', res)
      return
    }
    data.value = res.data
  } catch (err) {
    const serverData = err?.response?.data ?? raw.value
    console.error('Error fetching personal leaderboard', err, 'serverData=', serverData)
    error.value = serverData?.message || serverData?.error || err.message || 'Error fetching personal leaderboard'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (!auth.isLoggedIn) {
    window.location.href = '/login'
    return
  }
  fetch()
})
</script>
