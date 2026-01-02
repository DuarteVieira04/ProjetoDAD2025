<template>
  <div class="relative w-20 sm:w-40 h-28 sm:h-60">
    <Card
      v-if="card"
      class="shadow-2xl border-4 overflow-hidden"
      :class="card.isWinner ? 'border-yellow-400 shadow-yellow-400/70' : 'border-transparent'"
    >
      <img
        :src="`/assets/cards/${card.filename}`"
        class="w-full h-full object-cover"
        alt="Played card"
      />
    </Card>
    <div
      v-else
      class="flex justify-center items-center bg-gray-800/50 border-2 border-gray-600 border-dashed rounded-xl w-full h-full text-gray-500 text-xs sm:text-lg"
    >
      Waiting...
    </div>
  </div>
</template>

<script setup>
defineProps({
  card: {
    type: Object,
    default: null,
  },
})

import { Card } from '@/components/ui/card'
</script>
