<script setup>
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

const emit = defineEmits(['create-game'])
</script>

<template>
  <Dialog>
    <DialogTrigger as-child>
      <slot name="trigger" />
    </DialogTrigger>
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Create New Game</DialogTitle>
        <DialogDescription>
          Select the type of Bisca game you want to create (Standalone).
        </DialogDescription>
      </DialogHeader>
      <div class="gap-4 grid py-4">
        <Button @click="emit('create-game', '9')" class="w-full" size="lg">
          Bisca de 9 (9 cards)
        </Button>
        <Button @click="emit('create-game', '3')" variant="outline" class="w-full" size="lg">
          Bisca de 3 (3 cards)
        </Button>
      </div>
    </DialogContent>
  </Dialog>
</template>
