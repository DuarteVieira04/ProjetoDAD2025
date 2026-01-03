<template>
  <div class="space-y-6 mx-auto p-2 sm:p-6 max-w-3xl">
    <Card>
      <CardHeader>
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-4">
          <div>
            <CardTitle>Global Leaderboard</CardTitle>
            <CardDescription>Top players by selected metric</CardDescription>
          </div>
          <div class="flex items-center gap-2 w-full sm:w-auto">
            <label class="text-sm shrink-0">Metric:</label>
            <select v-model="mode" class="p-2 border rounded w-full sm:w-auto bg-background text-foreground">
              <option value="game">Game Wins</option>
              <option value="match">Match Wins</option>
            </select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div v-if="loading" class="py-8 text-center">Loading...</div>
        <div v-else class="overflow-x-auto">
          <table class="w-full table-auto text-sm sm:text-base">
            <thead>
              <tr class="text-left border-b">
                <th class="px-2 py-3 font-medium text-muted-foreground w-12 text-center">#</th>
                <th class="px-2 py-3 font-medium text-muted-foreground w-full">Name</th>
                <th class="px-2 py-3 font-medium text-muted-foreground whitespace-nowrap text-right">{{ metricLabel }}</th>
                <th class="px-2 py-3 font-medium text-muted-foreground text-right">Capotes</th>
                <th class="px-2 py-3 font-medium text-muted-foreground text-right">Bandeiras</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(u, idx) in displayedList" :key="u.user_id" class="border-b last:border-0 hover:bg-muted/50 transition-colors">
                <td class="px-2 py-3 text-center font-medium">{{ idx + 1 }}</td>
                <td class="px-2 py-3">
                  <div class="flex items-center gap-2 max-w-[120px] sm:max-w-none truncate">
                    <span
                        :class="{
                        'font-bold':
                            (u.name || u.nickname || '(Anonymous User)') === '(Anonymous User)',
                        italic: (u.name || u.nickname || '(Anonymous User)') === '(Anonymous User)',
                        }"
                    >
                        {{ u.name || u.nickname || '(Anonymous User)' }}
                    </span>
                  </div>
                </td>
                <td class="px-2 py-3 text-right font-bold">{{ mode === 'game' ? u.game_wins : u.match_wins }}</td>
                <td class="px-2 py-3 text-right text-muted-foreground">{{ u.capotes }}</td>
                <td class="px-2 py-3 text-right text-muted-foreground">{{ u.bandeiras }}</td>
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
