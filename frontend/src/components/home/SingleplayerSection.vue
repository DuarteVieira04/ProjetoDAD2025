<script setup>
import { Button } from '@/components/ui/button'

defineProps({
  isCreating: Boolean,
})

const emit = defineEmits(['create-game'])
</script>

<template>
  <div>
    <Button
      @click="emit('create-game', 'bot-9')"
      class="w-full h-12 text-sm"
      :disabled="isCreating"
      aria-label="Play Bisca de 9 against bot"
    >
      Bisca de 9 (vs Bot)
    </Button>
    <Button
      @click="emit('create-game', 'bot-3')"
      variant="outline"
      class="w-full h-12 text-sm"
      :disabled="isCreating"
      aria-label="Play Bisca de 3 against bot"
    >
      Bisca de 3 (vs Bot)
    </Button>
  </div>
</template>
