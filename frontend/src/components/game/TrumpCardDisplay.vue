<template>
  <Tooltip>
    <TooltipTrigger as-child>
      <Card class="bg-amber-700/90 shadow-2xl p-3 sm:p-6 border-4 border-amber-500">
        <p class="mb-2 font-bold text-amber-100 text-xs sm:text-lg text-center">Trump</p>
        <img
          v-if="trumpCard"
          :src="`/assets/cards/${trumpCard.filename}`"
          class="shadow-lg mx-auto rounded-lg w-12 sm:w-28 h-16 sm:h-40"
          alt="Trump card"
        />
        <div v-else class="bg-amber-900/50 rounded-lg w-12 sm:w-28 h-16 sm:h-40" />
      </Card>
    </TooltipTrigger>
    <TooltipContent>Trump suit beats all others</TooltipContent>
  </Tooltip>
</template>

<script setup>
defineProps({
  trumpCard: {
    type: Object,
    default: null,
  },
})

import { Card } from '@/components/ui/card'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
</script>
