<template>
  <div class="mx-auto p-4 max-w-4xl">
    <div v-if="matchStore.loading" class="py-12 text-muted-foreground text-center">
      <div
        class="inline-block border-primary border-t-2 border-b-2 rounded-full w-8 h-8 animate-spin"
      ></div>
      <p class="mt-4">Loading matches...</p>
    </div>

    <div v-else-if="matchStore.error" class="py-12 text-center">
      <p class="font-medium text-red-600">Error loading matches</p>
      <p class="mt-2 text-muted-foreground text-sm">{{ matchStore.error }}</p>
    </div>

    <ul v-else-if="matchStore.hasMatches" class="space-y-4">
      <li
        v-for="match in matchStore.getMatches"
        :key="match.id"
        class="bg-card hover:shadow-md border rounded-xl overflow-hidden transition-shadow duration-200"
      >
        <div class="p-5">
          <div class="flex justify-between items-center gap-6">
            <div class="flex flex-1 items-center gap-4 min-w-0">
              <Avatar class="border-2 border-white/20 w-8 sm:w-14 h-8 sm:h-14">
                <AvatarImage :src="match?.player1.avatar_url" />
                <AvatarFallback>{{
                  (match.player1?.nickname?.[0] || '?').toUpperCase()
                }}</AvatarFallback>
              </Avatar>

              <div class="flex-1 min-w-0">
                <div class="flex flex-wrap items-baseline gap-2">
                  <h3 class="font-semibold text-lg">Match #{{ match.id }}</h3>
                  <span
                    class="bg-green-100 dark:bg-green-900 px-2 py-1 rounded-full text-green-800 dark:text-green-200 text-xs"
                  >
                    Active
                  </span>
                </div>
                <p class="mt-1 text-muted-foreground text-sm">
                  Owner:
                  <span class="font-medium text-foreground">{{
                    match.player1?.nickname || 'Unknown'
                  }}</span>
                </p>
                <p class="mt-2 font-medium text-sm">
                  Stake: <span class="text-primary">{{ formatStake(match.stake) }}</span>
                </p>
                <p class="mt-2 text-muted-foreground text-xs">
                  Started: {{ formatDate(match.began_at) }}
                </p>
              </div>
            </div>
            <div class="flex flex-col items-end">
              <button
                @click="joinMatch(match)"
                class="bg-primary hover:bg-primary/90 disabled:opacity-50 shadow-sm px-6 py-3 rounded-lg font-semibold text-primary-foreground transition disabled:cursor-not-allowed"
                :disabled="isJoining(match.id)"
              >
                <span v-if="isJoining(match.id)">Joining...</span>
                <span v-else>Join Match</span>
              </button>
            </div>
          </div>
        </div>
      </li>
    </ul>

    <div v-else class="py-16 text-center">
      <div class="flex justify-center items-center bg-muted/50 mx-auto mb-6 rounded-full w-24 h-24">
        <svg
          class="w-12 h-12 text-muted-foreground"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <p class="font-medium text-muted-foreground text-lg">No matches available</p>
      <p class="mt-2 text-muted-foreground text-sm">Check back later for new matches.</p>
    </div>
  </div>
</template>

<script setup>
import Avatar from '@/components/ui/avatar/Avatar.vue'
import AvatarFallback from '@/components/ui/avatar/AvatarFallback.vue'
import AvatarImage from '@/components/ui/avatar/AvatarImage.vue'
import { useMatchStore } from '@/stores/match'
import { onMounted, ref } from 'vue'

const matchStore = useMatchStore()

// Track joining state per match to prevent double-clicks
const joiningIds = ref(new Set())

const isJoining = (matchId) => joiningIds.value.has(matchId)

// Placeholder for join logic – replace with your actual API call
const joinMatch = async (match) => {
  joiningIds.value.add(match.id)

  try {
    // Example: await axios.post(`/matches/${match.id}/join`)
    console.log('Joining match:', match.id)

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    alert(`Successfully joined match #${match.id}!`)
    // Optionally refresh matches or update local state
    // await matchStore.fetchMatches()
  } catch (error) {
    console.error('Failed to join match:', error)
    alert('Failed to join match. Please try again.')
  } finally {
    joiningIds.value.delete(match.id)
  }
}

const formatDate = (isoString) => {
  if (!isoString) return '—'
  const date = new Date(isoString)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC',
  })
}

const formatStake = (stake) => {
  if (!stake) return '$0'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(stake)
}

onMounted(async () => {
  await matchStore.fetchMatches()
})
</script>
