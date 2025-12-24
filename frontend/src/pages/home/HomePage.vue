<script setup>
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import Button from '@/components/ui/button/Button.vue'
import { useGameStore } from '@/stores/game'
import { inject, ref, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'

const game = useGameStore()
const router = useRouter()
const socket = inject('socket')

const isCreating = ref(false)

// Attach listener early for the creator
socket.once('gameCreated', (gameId) => {
  console.log('✅ gameCreated received:', gameId)
  isCreating.value = false

  // Creator is automatically player1
  game.gameId = gameId
  game.youAre = 'player1'

  router.push({ name: 'game', params: { id: gameId } })
})

const createNewGame = async (variant = '9') => {
  if (isCreating.value) return
  isCreating.value = true

  try {
    await game.createGame(variant)
    // No need to call joinGame here; server auto-assigns player1
  } catch (err) {
    console.error('Create game failed:', err)
    alert('Failed to create game')
    isCreating.value = false
  }
}

const goToLobby = () => {
  router.push('/lobby')
}

// Cleanup listener if component unmounts before gameCreated
onBeforeUnmount(() => {
  socket.off('gameCreated')
})
</script>

<template>
  <div class="p-8 text-center">
    <h1 class="mb-8 text-4xl">Bisca Platform</h1>


    <Dialog>
      <DialogTrigger as-child>
        <Button size="lg" :disabled="isCreating">
          <template v-if="isCreating">
            <svg
              class="inline mr-3 -ml-1 w-5 h-5 text-white animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Creating Game...
          </template>
          <template v-else>Create New Game</template>
        </Button>
      </DialogTrigger>
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Choose Game Variant</DialogTitle>
          <DialogDescription>
            Select the type of Bisca game you want to create.
          </DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-4">
          <Button @click="createNewGame('9')" class="w-full" size="lg"> Bisca de 9 (9 cards) </Button>
          <Button @click="createNewGame('3')" class="w-full" variant="outline" size="lg">
            Bisca de 3 (3 cards)
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    <div class="mt-4">
      <Button @click="goToLobby" variant="outline" size="lg">
        Go to Lobby
      </Button>
    </div>

    <!-- Optional: list open games for others to join -->
  </div>
</template>
