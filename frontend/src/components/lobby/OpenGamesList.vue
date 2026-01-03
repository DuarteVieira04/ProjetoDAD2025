<script setup>
defineProps({
  games: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['join-game'])
</script>

<template>
  <ul v-if="games.length" class="space-y-3">
    <li
      v-for="game in games"
      :key="game.gameId"
      class="flex justify-between items-center hover:bg-muted/40 p-4 border rounded-xl transition-colors"
    >
      <div class="space-y-1">
        <p class="font-medium text-sm">
          {{ game?.creator?.nickname || game.creator || 'Anonymous' }}'s Game
        </p>
        <p class="text-muted-foreground text-xs">Bisca: {{ game.variant }}</p>
      </div>
      <button
        @click="emit('join-game', game.gameId)"
        class="inline-flex justify-center items-center hover:bg-muted px-3 py-1.5 border rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-medium text-sm transition-colors"
        aria-label="Join game"
      >
        Join
      </button>
    </li>
  </ul>
  <p v-else class="py-6 text-muted-foreground text-sm text-center">
    No open games right now. Create one to get started.
  </p>
</template>
