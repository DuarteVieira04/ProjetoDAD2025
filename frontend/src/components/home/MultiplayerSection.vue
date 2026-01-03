<script setup>
import { Button } from '@/components/ui/button'
import CreateMatchDialog from './CreateMatchDialog.vue'

defineProps({
  isLoggedIn: Boolean,
  isCreating: Boolean,
})

const emit = defineEmits(['create-game', 'go-to-lobby', 'go-to-login', 'creating'])
</script>

<template>
  <div class="gap-3 grid">
    <Button @click="emit('create-game', '9')" class="w-full h-10 text-sm" :disabled="isCreating">
      Start Bisca de 9 (PvP)
    </Button>
    <Button
      @click="emit('create-game', '3')"
      variant="outline"
      class="w-full h-10 text-sm"
      :disabled="isCreating"
    >
      Start Bisca de 3 (PvP)
    </Button>

    <CreateMatchDialog @creating="emit('creating', $event)">
      <template #trigger="{ disabled }">
        <Button
          class="bg-black hover:bg-zinc-800 w-full h-10 text-white text-sm"
          :disabled="disabled"
        >
          Create Match (Stake)
        </Button>
      </template>
    </CreateMatchDialog>

    <div class="relative py-4">
      <div class="absolute inset-0 flex items-center">
        <span class="border-t w-full" />
      </div>
      <div class="relative flex justify-center text-xs uppercase">
        <span class="bg-background px-2 text-muted-foreground">Or</span>
      </div>
    </div>

    <Button @click="emit('go-to-lobby')" variant="secondary" class="w-full h-10 text-sm">
      Browse Open Games (Lobby)
    </Button>
  </div>
</template>
