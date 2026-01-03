<script setup>
defineProps({
  matches: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['join-match'])
</script>

<template>
  <ul v-if="matches.length" class="space-y-3">
    <li
      v-for="match in matches"
      :key="match.matchId"
      class="flex justify-between items-center hover:bg-muted/40 p-4 border rounded-xl transition-colors"
    >
      <div class="space-y-1">
        <p class="font-medium text-sm">
          {{ match?.creator?.nickname || match.creator || 'Anonymous' }}'s Match
        </p>
        <p class="text-muted-foreground text-xs">
          Bisca {{ match.variant }} • Stake: {{ match.stake }} coins
        </p>
      </div>
      <button
        @click="emit('join-match', match.matchId)"
        class="inline-flex justify-center items-center hover:bg-muted px-3 py-1.5 border rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-medium text-sm transition-colors"
        aria-label="Join match"
      >
        Join
      </button>
    </li>
  </ul>
  <p v-else class="py-6 text-muted-foreground text-sm text-center">No open matches right now.</p>
</template>
