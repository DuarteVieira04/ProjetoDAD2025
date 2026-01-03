<script setup>
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useLobbyStore } from '@/stores/lobby'
import { useRouter } from 'vue-router'

const lobbyStore = useLobbyStore()
const router = useRouter()

const matchStake = ref(3)
const isCreating = ref(false)

const emit = defineEmits(['creating'])

const handleCreateMatch = async (variant) => {
  if (isCreating.value) return
  isCreating.value = true
  emit('creating', true)

  try {
    const res = await lobbyStore.createMatch(variant, matchStake.value)
    if (res.matchId) {
      router.push({ name: 'game', params: { id: res.matchId }, query: { type: 'match' } })
    }
  } catch (e) {
    alert('Failed to create match: ' + e.message)
  } finally {
    isCreating.value = false
    emit('creating', false)
  }
}
</script>

<template>
  <Dialog>
    <DialogTrigger as-child>
      <slot name="trigger" :disabled="isCreating" />
    </DialogTrigger>
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Create Match (4 Marks)</DialogTitle>
        <DialogDescription> Set the stake and choose the variant. </DialogDescription>
      </DialogHeader>
      <div class="gap-4 grid py-4">
        <div class="flex flex-col gap-2">
          <label for="stake" class="font-medium text-sm">Stake (Coins)</label>
          <input
            id="stake"
            v-model.number="matchStake"
            type="number"
            min="3"
            max="100"
            class="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            aria-describedby="stake-help"
          />
          <p id="stake-help" class="text-[0.8rem] text-muted-foreground">Min: 3, Max: 100</p>
        </div>

        <div class="gap-2 grid grid-cols-2 mt-4">
          <Button @click="handleCreateMatch('9')" size="lg" class="w-full"> Bisca 9 </Button>
          <Button @click="handleCreateMatch('3')" variant="outline" size="lg" class="w-full">
            Bisca 3
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
