<template>
  <div class="flex items-center gap-4">
    <Badge
      v-if="isMatch"
      variant="outline"
      class="px-3 sm:px-6 py-1 sm:py-3 border-white/30 text-white text-sm sm:text-xl"
    >
      Stake: {{ stake }} coins
    </Badge>

    <Badge
      variant="outline"
      class="px-3 sm:px-6 py-1 sm:py-3 border-white/30 text-white text-sm sm:text-xl"
    >
      Stock: {{ stockCount }}
    </Badge>
  </div>
</template>

<script setup>
defineProps({
  isMatch: Boolean,
  stake: Number,
  stockCount: Number,
})

import { Badge } from '@/components/ui/badge'
</script>
