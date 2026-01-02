<template>
  <div class="flex justify-center items-center bg-muted/40 p-6 min-h-screen">
    <div class="space-y-6 w-full max-w-2xl">
      <div class="bg-background shadow-sm p-6 border rounded-2xl">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="font-semibold text-2xl tracking-tight">Card Game Lobby</h1>
            <p class="mt-1 text-muted-foreground text-sm">Create a game or join an open match</p>
          </div>

          <div class="flex items-center">
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
                  <DialogTitle>Create New Game</DialogTitle>
                  <DialogDescription>
                    Select the type of Bisca game you want to create (Standalone).
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
            <Dialog>
              <DialogTrigger as-child>
                <button
                  class="inline-flex justify-center items-center bg-black hover:bg-zinc-800 ml-2 px-4 py-2 rounded-md font-medium text-white text-sm transition"
                >
                  Create Match
                </button>
              </DialogTrigger>
              <DialogContent class="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create Match (4 Marks)</DialogTitle>
                  <DialogDescription> Set the stake and choose the variant. </DialogDescription>
                </DialogHeader>
                <div class="gap-4 grid py-4">
                  <div class="flex flex-col gap-2">
                    <label class="font-medium text-sm">Stake (Coins)</label>
                    <input
                      v-model="matchStake"
                      type="number"
                      min="3"
                      max="100"
                      class="px-3 py-2 border rounded-md"
                    />
                    <p class="text-[0.8rem] text-muted-foreground">Min: 3, Max: 100</p>
                  </div>

                  <div class="gap-2 grid grid-cols-2 mt-2">
                    <Button @click="handleCreateMatch('9')" class="w-full" size="lg">
                      Bisca 9
                    </Button>
                    <Button
                      @click="handleCreateMatch('3')"
                      class="w-full"
                      variant="outline"
                      size="lg"
                    >
                      Bisca 3
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
      <div class="bg-background shadow-sm p-6 border rounded-2xl">
        <h2 class="mb-4 font-semibold text-lg">Open Games</h2>

        <ul v-if="lobbyStore.openGames && lobbyStore.openGames.length" class="space-y-3">
          <li
            v-for="game in lobbyStore.openGames"
            :key="game.gameId"
            class="flex justify-between items-center hover:bg-muted/40 p-4 border rounded-xl transition"
          >
            <div class="space-y-1">
              <p class="font-medium text-sm">
                {{ game?.creator?.nickname || game.creator }}'s Game
              </p>
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
      <div class="bg-background shadow-sm p-6 border rounded-2xl">
        <h2 class="mb-4 font-semibold text-lg">Open Matches (4 Marks)</h2>

        <ul v-if="lobbyStore.openMatches && lobbyStore.openMatches.length" class="space-y-3">
          <li
            v-for="match in lobbyStore.openMatches"
            :key="match.matchId"
            class="flex justify-between items-center hover:bg-muted/40 p-4 border rounded-xl transition"
          >
            <div class="space-y-1">
              <p class="font-medium text-sm">
                {{ match.creator.nickname || match.creator }}'s Match
              </p>
              <p class="text-muted-foreground text-xs">
                Bisca {{ match.variant }} • Stake: {{ match.stake }}
              </p>
            </div>

            <button
              @click="handleJoinMatch(match.matchId)"
              class="inline-flex justify-center items-center hover:bg-muted px-3 py-1.5 border rounded-md font-medium text-sm transition"
            >
              Join
            </button>
          </li>
        </ul>

        <p v-else class="py-6 text-muted-foreground text-sm text-center">
          No open matches right now.
        </p>
      </div>
      <p class="text-muted-foreground text-xs text-center">
        Share your game link with friends or wait for someone to join.
      </p>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
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
const matchStake = ref(3)

onMounted(() => {
  lobbyStore.joinLobby()
})

async function handleCreateGame(variant = '9') {
  try {
    const res = await lobbyStore.createGame(variant)
    if (res.gameId) {
      router.push(`/game/${res.gameId}`)
    }
  } catch (e) {
    alert('Failed to create game: ' + e)
  }
}

async function handleCreateMatch(variant) {
  try {
    const res = await lobbyStore.createMatch(variant, matchStake.value)
    if (res.matchId) {
      router.push({ name: 'game', params: { id: res.matchId }, query: { type: 'match' } })
    }
  } catch (e) {
    alert('Failed to create match: ' + e)
  }
}

async function handleJoinGame(gameId) {
  router.push(`/game/${gameId}`)
}

async function handleJoinMatch(matchId) {
  router.push({ name: 'game', params: { id: matchId }, query: { type: 'match' } })
}
</script>
