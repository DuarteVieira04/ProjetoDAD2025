<template>
  <div class="flex items-center gap-3 sm:gap-5">
    <Avatar class="border-2 border-white/20 w-10 sm:w-16 h-10 sm:h-16">
      <AvatarImage :src="avatar" alt="Your avatar" />
      <AvatarFallback>ME</AvatarFallback>
    </Avatar>
    <div class="sm:text-left text-center">
      <p class="font-semibold text-sm sm:text-xl">{{ nickname }}</p>
      <Badge variant="default" class="text-xs sm:text-base"> {{ points }} points </Badge>
    </div>
  </div>

  <Button
    v-if="isPlaying"
    variant="destructive"
    size="lg"
    class="px-6 sm:px-10 h-10 sm:h-14 text-sm sm:text-lg"
    @click="$emit('resign')"
  >
    Resign
  </Button>
</template>

<script setup>
defineProps({
  avatar: String,
  nickname: String,
  points: Number,
  isPlaying: Boolean,
})

defineEmits(['resign'])

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
</script>
