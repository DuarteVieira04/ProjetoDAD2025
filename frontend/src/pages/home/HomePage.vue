<script setup>
import { inject, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { useAuthStore } from '@/stores/auth'
import { useLobbyStore } from '@/stores/lobby'
import Button from '@/components/ui/button/Button.vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Lock } from 'lucide-vue-next'

const game = useGameStore()
const lobbyStore = useLobbyStore()
const authStore = useAuthStore()
const router = useRouter()
const socket = inject('socket')

const isCreating = ref(false)
const matchStake = ref(3)

socket.once('gameCreated', (gameId) => {
  console.log('gameCreated received:', gameId)
  isCreating.value = false

  game.gameId = gameId
  game.youAre = 'player1'

  router.push({ name: 'game', params: { id: gameId } })
})

onBeforeUnmount(() => {
  socket.off('gameCreated')
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

const handleCreateMatch = async (variant) => {
  try {
    const res = await lobbyStore.createMatch(variant, matchStake.value)
    if (res.matchId) {
      router.push({ name: 'game', params: { id: res.matchId }, query: { type: 'match' } })
    }
  } catch (e) {
    alert('Failed to create match: ' + e)
  }
}

const goToLobby = () => {
  router.push('/lobby')
}

const goToLogin = () => {
  router.push('/login')
}
</script>

<template>
  <div class="flex flex-col justify-center items-center p-4 sm:p-6 min-h-screen container">
    <div class="mb-8 text-center">
      <h1 class="mb-2 font-bold text-3xl sm:text-4xl tracking-tight">Bisca Platform</h1>
      <p class="text-muted-foreground text-base">Choose your game mode</p>
    </div>

    <div class="gap-4 grid grid-cols-1 md:grid-cols-2 w-full max-w-3xl">
      <Card class="flex flex-col shadow-sm hover:shadow-md border-2 overflow-hidden transition-all">
        <CardHeader class="pb-2">
          <CardTitle class="flex items-center gap-2 text-xl">
            🤖 Singleplayer
            <Badge variant="secondary" class="text-xs">Offline-ish</Badge>
          </CardTitle>
          <CardDescription class="text-sm">
            Play against our intelligent Bot. Perfect for practice.
          </CardDescription>
        </CardHeader>
        <CardContent class="flex flex-col flex-1 justify-center gap-3 pt-4">
          <Button
            @click="createNewGame('bot-9')"
            class="w-full h-12 text-sm"
            :disabled="isCreating"
          >
            Bisca de 9 (vs Bot)
          </Button>
          <Button
            @click="createNewGame('bot-3')"
            variant="outline"
            class="w-full h-12 text-sm"
            :disabled="isCreating"
          >
            Bisca de 3 (vs Bot)
          </Button>
        </CardContent>
      </Card>

      <div class="group relative flex flex-col h-full">
        <div
          v-if="!authStore.isLoggedIn"
          class="z-10 absolute inset-0 flex flex-col justify-center items-center bg-background/60 backdrop-blur-sm border-2 rounded-xl"
        >
          <Lock class="mb-3 w-8 h-8 text-muted-foreground" />
          <h3 class="mb-1 font-semibold text-lg">Login Required</h3>
          <p class="mb-4 text-muted-foreground text-xs">Log in to play with others</p>
          <Button @click="goToLogin" size="sm">Log In</Button>
        </div>

        <Card
          class="flex flex-col shadow-sm border-2 h-full overflow-hidden"
          :class="{ 'opacity-50 pointer-events-none select-none': !authStore.isLoggedIn }"
        >
          <CardHeader class="pb-2">
            <CardTitle class="flex items-center gap-2 text-xl">
              🌍 Multiplayer
              <Badge class="text-xs">Online</Badge>
            </CardTitle>
            <CardDescription class="text-sm">
              Challenge other players in real-time matchups.
            </CardDescription>
          </CardHeader>
          <CardContent class="gap-3 grid grid-cols-1 pt-4">
            <Button @click="createNewGame('9')" class="w-full h-10 text-sm" :disabled="isCreating">
              Start Bisca de 9 (PvP)
            </Button>
            <Button
              @click="createNewGame('3')"
              variant="outline"
              class="w-full h-10 text-sm"
              :disabled="isCreating"
            >
              Start Bisca de 3 (PvP)
            </Button>

            <Dialog>
              <DialogTrigger as-child>
                <Button
                  class="bg-black hover:bg-zinc-800 w-full h-10 text-white text-sm"
                  :disabled="isCreating"
                >
                  Create Match (Stake)
                </Button>
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

            <div class="relative py-2">
              <div class="absolute inset-0 flex items-center">
                <span class="border-t w-full" />
              </div>
              <div class="relative flex justify-center text-[10px] uppercase">
                <span class="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <Button @click="goToLobby" variant="secondary" class="w-full h-10 text-sm">
              Browse Open Games (Lobby)
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
