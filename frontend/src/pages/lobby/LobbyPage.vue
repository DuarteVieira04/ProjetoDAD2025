<script setup>
import { onMounted } from 'vue'
import { useLobbyStore } from '@/stores/lobby'
import { useRouter } from 'vue-router'
import Button from '@/components/ui/button/Button.vue'

import CreateGameDialog from '@/components/lobby/CreateGameDialog.vue'
import CreateMatchDialog from '@/components/home/CreateMatchDialog.vue'
import OpenGamesList from '@/components/lobby/OpenGamesList.vue'
import OpenMatchesList from '@/components/lobby/OpenMatchesList.vue'

const lobbyStore = useLobbyStore()
const router = useRouter()

onMounted(() => {
  lobbyStore.joinLobby()
})

const handleCreateGame = async (variant) => {
  try {
    const res = await lobbyStore.createGame(variant)
    if (res.gameId) {
      router.push(`/game/${res.gameId}`)
    }
  } catch (e) {
    alert('Failed to create game: ' + e)
  }
}

const handleJoinGame = (gameId) => {
  router.push(`/game/${gameId}`)
}

const handleJoinMatch = (matchId) => {
  router.push({ name: 'game', params: { id: matchId }, query: { type: 'match' } })
}
</script>

<template>
  <div class="flex justify-center items-center p-6 min-h-screen">
    <div class="space-y-6 w-full max-w-2xl">
      <!-- Header + Create Buttons -->
      <div class="bg-background shadow-sm p-6 border rounded-2xl">
        <div class="flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 class="font-semibold text-2xl tracking-tight">Card Game Lobby</h1>
            <p class="mt-1 text-muted-foreground text-sm">Create a game or join an open match</p>
          </div>

          <div class="flex gap-2">
            <CreateGameDialog @create-game="handleCreateGame">
              <template #trigger>
                <Button class="font-medium"> Create Game </Button>
              </template>
            </CreateGameDialog>

            <CreateMatchDialog>
              <template #trigger>
                <Button class="bg-black hover:bg-zinc-800 font-medium text-white">
                  Create Match
                </Button>
              </template>
            </CreateMatchDialog>
          </div>
        </div>
      </div>

      <!-- Open Games -->
      <div class="bg-background shadow-sm p-6 border rounded-2xl">
        <h2 class="mb-4 font-semibold text-lg">Open Games</h2>
        <OpenGamesList :games="lobbyStore.openGames" @join-game="handleJoinGame" />
      </div>

      <!-- Open Matches -->
      <div class="bg-background shadow-sm p-6 border rounded-2xl">
        <h2 class="mb-4 font-semibold text-lg">Open Matches (4 Marks)</h2>
        <OpenMatchesList :matches="lobbyStore.openMatches" @join-match="handleJoinMatch" />
      </div>

      <p class="text-muted-foreground text-xs text-center">
        Share your game link with friends or wait for someone to join.
      </p>
    </div>
  </div>
</template>
