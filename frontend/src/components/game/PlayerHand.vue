<template>
  <div class="flex flex-wrap justify-center gap-3 sm:gap-6 bg-black/40 p-4 sm:p-8 w-full">
    <div class="flex flex-wrap justify-center gap-3 sm:gap-6">
      <Tooltip v-for="card in hand" :key="`card-${card.filename}`">
        <TooltipTrigger as-child>
          <Button
            variant="ghost"
            class="relative shadow-2xl p-0 rounded-xl overflow-hidden transition-all duration-300"
            :class="[
              !isMyTurn
                ? 'opacity-60 grayscale cursor-not-allowed'
                : 'opacity-100 grayscale-0 cursor-pointer',
              isMyTurn
                ? 'hover:scale-110 sm:hover:scale-125 ring-4 ring-blue-500/70 scale-105'
                : 'hover:scale-100',
            ]"
            :disabled="!isMyTurn"
            @click="isMyTurn && $emit('play-card', card)"
          >
            <img
              :src="`/assets/cards/${card.filename}`"
              class="rounded-lg w-16 sm:w-32 h-24 sm:h-48 object-cover pointer-events-none"
              alt="Card"
            />
            <div
              v-if="!isMyTurn"
              class="absolute inset-0 bg-black/50 rounded-xl pointer-events-none"
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" class="max-w-64">
          <span class="font-semibold"
            >{{ card.rank || 'Unknown' }} of {{ card.suit || 'Unknown' }}</span
          >
          <div class="opacity-90 mt-1 text-sm">{{ card.value || 0 }} points</div>
        </TooltipContent>
      </Tooltip>
    </div>
  </div>
</template>

<script setup>
defineProps({
  hand: {
    type: Array,
    required: true,
  },
  isMyTurn: {
    type: Boolean,
    required: true,
  },
})

defineEmits(['play-card'])

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
</script>
