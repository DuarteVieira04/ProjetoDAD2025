<template>
  <div class="flex items-center gap-3 sm:gap-5">
    <Avatar class="border-2 border-white/20 w-10 sm:w-16 h-10 sm:h-16">
      <AvatarImage :src="avatar" alt="Opponent avatar" />
      <AvatarFallback>OP</AvatarFallback>
    </Avatar>
    <div class="sm:text-left text-center">
      <p class="font-semibold text-sm sm:text-xl">{{ nickname }}</p>
      <Badge variant="secondary" class="text-xs sm:text-base"> {{ points }} points </Badge>
    </div>
  </div>
</template>

<script setup>
defineProps({
  avatar: String,
  nickname: String,
  points: Number,
})

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
</script>
