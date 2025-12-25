<template>
  <div class="flex justify-center items-center bg-muted/40 p-6 min-h-screen">
    <div class="space-y-6 w-full max-w-2xl">
      <!-- Header Card -->
      <div class="bg-background shadow-sm p-6 border rounded-2xl">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="font-semibold text-2xl tracking-tight">Card Game Lobby</h1>
            <p class="mt-1 text-muted-foreground text-sm">Create a game or join an open match</p>
          </div>

          <Dialog>
            <DialogTrigger as-child>
              <button
                class="inline-flex justify-center items-center bg-primary hover:bg-primary/90 px-4 py-2 rounded-md font-medium text-primary-foreground text-sm transition"
              >
                Create Game
              </button>
            </DialogTrigger>
            <DialogContent class="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Choose Game Variant</DialogTitle>
                <DialogDescription>
                  Select the type of Bisca game you want to create.
                </DialogDescription>
              </DialogHeader>
              <div class="gap-4 grid py-4">
                <Button @click="handleCreateGame('9')" class="w-full" size="lg">
                  Bisca de 9 (9 cards)
                </Button>
                <Button @click="handleCreateGame('3')" class="w-full" variant="outline" size="lg">
                  Bisca de 3 (3 cards)
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <!-- Open Games -->
      <div class="bg-background shadow-sm p-6 border rounded-2xl">
        <h2 class="mb-4 font-semibold text-lg">Open Games</h2>

        <ul v-if="lobbyStore.openGames.length" class="space-y-3">
          <li
            v-for="game in lobbyStore.openGames"
            :key="game.gameId"
            class="flex justify-between items-center hover:bg-muted/40 p-4 border rounded-xl transition"
          >
            <div class="space-y-1">
              <p class="font-medium text-sm">{{ game.creator.nickname || game.creator }}'s Game</p>
              <p class="text-muted-foreground text-xs">Bisca: {{ game.variant }}</p>
            </div>

            <button
              @click="handleJoinGame(game.gameId)"
              class="inline-flex justify-center items-center hover:bg-muted px-3 py-1.5 border rounded-md font-medium text-sm transition"
            >
              Join
            </button>
          </li>
        </ul>

        <p v-else class="py-6 text-muted-foreground text-sm text-center">
          No open games right now. Create one to get started.
        </p>
      </div>

      <!-- Footer Hint -->
      <p class="text-muted-foreground text-xs text-center">
        Share your game link with friends or wait for someone to join.
      </p>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useLobbyStore } from '@/stores/lobby'
import { useRouter } from 'vue-router'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import Button from '@/components/ui/button/Button.vue'

const lobbyStore = useLobbyStore()
const router = useRouter()

onMounted(() => {
  lobbyStore.joinLobby()
  // Lobby listeners are assumed to be set up in the store
})

async function handleCreateGame(variant = '9') {
  try {
    const res = await lobbyStore.createGame(variant)
    if (res.gameId) {
      router.push(`/game/${res.gameId}`)
    }
  } catch {
    alert('Failed to create game')
  }
}

async function handleJoinGame(gameId) {
  // Navigate first, let GameView handle the actual joining.
  // This avoids the race condition where 'gameStarted' event arrives before GameView is mounted.
  router.push(`/game/${gameId}`)
}
</script>
