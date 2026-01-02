<template>
  <div class="space-y-6 mx-auto p-6 max-w-3xl">
    <Card>
      <CardHeader>
        <div class="flex items-center justify-between w-full">
          <div>
            <CardTitle>Global Leaderboard</CardTitle>
            <CardDescription>Top players by selected metric</CardDescription>
          </div>
          <div class="flex items-center gap-2">
            <label class="text-sm">Metric:</label>
            <select v-model="mode" class="p-2 border rounded">
              <option value="game">Game Wins</option>
              <option value="match">Match Wins</option>
            </select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div v-if="loading" class="py-8 text-center">Loading...</div>
        <div v-else>
          <table class="w-full table-auto">
            <thead>
              <tr class="text-left">
                <th class="px-2 py-2">#</th>
                <th class="px-2 py-2">Name</th>
                <th class="px-2 py-2 whitespace-nowrap">{{ metricLabel }}</th>
                <th class="px-2 py-2">Capotes</th>
                <th class="px-2 py-2">Bandeiras</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(u, idx) in displayedList" :key="u.user_id" class="border-t">
                <td class="px-2 py-2">{{ idx + 1 }}</td>
                <td class="px-2 py-2">
                  <span
                    :class="{
                      'font-bold':
                        (u.name || u.nickname || '(Anonymous User)') === '(Anonymous User)',
                      italic: (u.name || u.nickname || '(Anonymous User)') === '(Anonymous User)',
                    }"
                  >
                    {{ u.name || u.nickname || '(Anonymous User)' }}
                  </span>
                </td>
                <td class="px-2 py-2 whitespace-nowrap">
                  {{ mode === 'game' ? u.game_wins : u.match_wins }}
                </td>
                <td class="px-2 py-2">{{ u.capotes }}</td>
                <td class="px-2 py-2">{{ u.bandeiras }}</td>
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
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

const api = useAPIStore()
const topByGames = ref([])
const topByMatches = ref([])
const loading = ref(false)
const mode = ref('game')

const fetch = async () => {
  loading.value = true
  try {
    const res = await api.getGlobalLeaderboard(50)
    topByGames.value = res.data.top_by_games || []
    topByMatches.value = res.data.top_by_matches || []
  } catch (err) {
    console.error('Error fetching global leaderboard', err)
  } finally {
    loading.value = false
  }
}

onMounted(fetch)

const displayedList = computed(() =>
  mode.value === 'game' ? topByGames.value : topByMatches.value,
)
const metricLabel = computed(() => (mode.value === 'game' ? 'Game Wins' : 'Match Wins'))
</script>
