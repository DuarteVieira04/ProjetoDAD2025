<template>
  <div class="space-y-6 mx-auto p-2 sm:p-6 max-w-3xl">
    <Card>
      <CardHeader>
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-4">
          <div>
            <CardTitle>My Leaderboard</CardTitle>
            <CardDescription>Your multiplayer stats</CardDescription>
          </div>
          <div class="flex items-center gap-2 w-full sm:w-auto">
            <label class="text-sm shrink-0">Variant:</label>
            <select v-model="variant" @change="fetch" class="p-2 border rounded w-full sm:w-auto bg-background text-foreground">
              <option value="both">Both</option>
              <option value="3">3</option>
              <option value="9">9</option>
            </select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div v-if="loading" class="py-8 text-center">Loading...</div>
        <div v-else class="overflow-x-auto">
          <div v-if="error" class="text-red-600 mb-4">{{ error }}</div>

          <table class="w-full table-auto text-sm sm:text-base">
            <thead>
              <tr class="text-left border-b">
                <th class="px-2 py-3 font-medium text-muted-foreground w-full">Name</th>
                <th class="px-2 py-3 font-medium text-muted-foreground whitespace-nowrap text-right">Game Wins</th>
                <th class="px-2 py-3 font-medium text-muted-foreground whitespace-nowrap text-right">Match Wins</th>
                <th class="px-2 py-3 font-medium text-muted-foreground text-right">Capotes</th>
                <th class="px-2 py-3 font-medium text-muted-foreground text-right">Bandeiras</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b last:border-0 hover:bg-muted/50 transition-colors">
                <td class="px-2 py-3">
                  <span :class="{ 'font-bold italic': displayName === '(Anonymous User)' }">{{
                    displayName
                  }}</span>
                </td>
                <td class="px-2 py-3 text-right font-bold">{{ data.game_wins }}</td>
                <td class="px-2 py-3 text-right font-bold">{{ data.match_wins }}</td>
                <td class="px-2 py-3 text-right text-muted-foreground">{{ data.capotes }}</td>
                <td class="px-2 py-3 text-right text-muted-foreground">{{ data.bandeiras }}</td>
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

const displayName = computed(() => data.value.name || data.value.nickname || '(Anonymous User)')

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
    error.value =
      serverData?.message ||
      serverData?.error ||
      err.message ||
      'Error fetching personal leaderboard'
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
