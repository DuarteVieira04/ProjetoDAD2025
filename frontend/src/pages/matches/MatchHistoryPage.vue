<template>
  <div class="space-y-6 mx-auto p-6 max-w-7xl">
    <div class="flex justify-between items-center">
      <h1 class="font-extrabold text-gray-900 text-4xl">
        {{ getPageTitle() }}
      </h1>
      <Select v-if="isAdmin" v-model="viewMode" @update:modelValue="onViewModeChange">
        <SelectTrigger class="w-[200px]">
          <SelectValue placeholder="Select view" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Matches</SelectItem>
          <SelectItem value="personal">My Matches</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div v-if="loading" class="flex justify-center items-center py-12">
      <div class="border-primary border-t-4 border-b-4 rounded-full w-12 h-12 animate-spin"></div>
    </div>

    <div v-else-if="error" class="bg-red-50 p-6 rounded-lg text-center">
      <p class="font-semibold text-red-600">{{ error }}</p>
    </div>

    <Card v-else-if="matches.length > 0" class="shadow-lg">
      <CardHeader>
        <CardTitle class="text-2xl">Match Records</CardTitle>
        <CardDescription>
          {{ getCardDescription() }}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Match ID</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Player 1</TableHead>
              <TableHead>Player 2</TableHead>
              <TableHead>Result</TableHead>
              <TableHead>Stake</TableHead>
              <TableHead>Date</TableHead>
              <TableHead class="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="match in matches" :key="match.id" class="hover:bg-gray-50">
              <TableCell class="font-medium">#{{ match.id }}</TableCell>
              <TableCell>
                <span class="bg-blue-100 px-2 py-1 rounded font-semibold text-blue-800 text-xs">
                  Bisca {{ match.type }}
                </span>
              </TableCell>
              <TableCell>
                <div class="flex items-center gap-2">
                  <Avatar class="w-8 h-8">
                    <AvatarImage :src="match.player1?.avatar_url" />
                    <AvatarFallback>{{ match.player1?.name?.[0] || 'P1' }}</AvatarFallback>
                  </Avatar>
                  <span class="font-medium">{{ match.player1?.name || '(Anonymous User)' }}</span>
                  <Trophy
                    v-if="match.winner_user_id === match.player1_user_id"
                    class="w-4 h-4 text-yellow-500"
                  />
                </div>
              </TableCell>
              <TableCell>
                <div class="flex items-center gap-2">
                  <Avatar class="w-8 h-8">
                    <AvatarImage :src="match.player2?.avatar_url" />
                    <AvatarFallback>{{ match.player2?.name?.[0] || 'P2' }}</AvatarFallback>
                  </Avatar>
                  <span class="font-medium">{{ match.player2?.name || '(Anonymous User)' }}</span>
                  <Trophy
                    v-if="match.winner_user_id === match.player2_user_id"
                    class="w-4 h-4 text-yellow-500"
                  />
                </div>
              </TableCell>
              <TableCell>
                <span v-if="match.winner_user_id" class="font-semibold">
                  {{ match.player1_marks }} - {{ match.player2_marks }}
                </span>
                <span v-else class="text-gray-500 italic">Draw</span>
              </TableCell>
              <TableCell>
                <span class="flex items-center gap-1">
                  <Coins class="w-4 h-4 text-yellow-600" />
                  {{ match.stake }}
                </span>
              </TableCell>
              <TableCell class="text-gray-600 text-sm">
                {{ formatDate(match.ended_at) }}
              </TableCell>
              <TableCell class="text-right">
                <Button variant="outline" size="sm" @click="viewMatchDetails(match.id)">
                  <Eye class="mr-1 w-4 h-4" />
                  View Details
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <div v-if="pagination" class="flex justify-between items-center mt-6">
          <p class="text-gray-600 text-sm">
            Showing {{ pagination.from }} to {{ pagination.to }} of {{ pagination.total }} matches
          </p>
          <div class="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              :disabled="!pagination.prev_page_url"
              @click="loadPage(pagination.current_page - 1)"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              :disabled="!pagination.next_page_url"
              @click="loadPage(pagination.current_page + 1)"
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
    <Card v-else class="shadow-lg">
      <CardContent class="py-12 text-center">
        <div
          class="flex justify-center items-center bg-gray-100 mx-auto mb-4 rounded-full w-16 h-16"
        >
          <History class="w-8 h-8 text-gray-400" />
        </div>
        <h3 class="font-semibold text-gray-900 text-lg">No matches found</h3>
        <p class="mt-2 text-gray-600 text-sm">
          {{ getEmptyMessage() }}
        </p>
      </CardContent>
    </Card>
    <Dialog v-model:open="showDetailsDialog">
      <DialogContent class="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Match #{{ selectedMatch?.id }} Details</DialogTitle>
          <DialogDescription>Complete match information and game breakdown</DialogDescription>
        </DialogHeader>

        <div v-if="selectedMatch" class="space-y-6">
          <div class="bg-gray-50 p-4 rounded-lg">
            <h4 class="mb-3 font-semibold text-lg">Match Summary</h4>
            <div class="gap-4 grid grid-cols-2">
              <div>
                <p class="text-gray-600 text-sm">Type</p>
                <p class="font-medium">Bisca {{ selectedMatch.type }}</p>
              </div>
              <div>
                <p class="text-gray-600 text-sm">Stake</p>
                <p class="font-medium">{{ selectedMatch.stake }} coins</p>
              </div>
              <div>
                <p class="text-gray-600 text-sm">Started</p>
                <p class="font-medium">{{ formatDate(selectedMatch.began_at) }}</p>
              </div>
              <div>
                <p class="text-gray-600 text-sm">Ended</p>
                <p class="font-medium">{{ formatDate(selectedMatch.ended_at) }}</p>
              </div>
              <div>
                <p class="text-gray-600 text-sm">Duration</p>
                <p class="font-medium">{{ formatDuration(selectedMatch.total_time) }}</p>
              </div>
              <div>
                <p class="text-gray-600 text-sm">Final Score</p>
                <p class="font-medium">
                  {{ selectedMatch.player1_marks }} - {{ selectedMatch.player2_marks }}
                </p>
              </div>
            </div>
          </div>
          <div class="gap-4 grid grid-cols-2">
            <div
              class="p-4 border rounded-lg"
              :class="
                selectedMatch.winner_user_id === selectedMatch.player1_user_id
                  ? 'bg-green-50 border-green-200'
                  : ''
              "
            >
              <div class="flex items-center gap-3 mb-2">
                <Avatar class="w-12 h-12">
                  <AvatarImage :src="selectedMatch.player1?.avatar_url" />
                  <AvatarFallback>{{
                    selectedMatch.player1?.nickname?.[0] || 'P1'
                  }}</AvatarFallback>
                </Avatar>
                <div>
                  <p class="font-semibold">{{ selectedMatch.player1?.nickname || 'Player 1' }}</p>
                  <p class="text-gray-600 text-sm">{{ selectedMatch.player1?.name }}</p>
                </div>
                <Trophy
                  v-if="selectedMatch.winner_user_id === selectedMatch.player1_user_id"
                  class="ml-auto w-6 h-6 text-yellow-500"
                />
              </div>
              <div class="space-y-1 text-sm">
                <p>
                  Points: <span class="font-semibold">{{ selectedMatch.player1_points }}</span>
                </p>
                <p>
                  Marks: <span class="font-semibold">{{ selectedMatch.player1_marks }}</span>
                </p>
              </div>
            </div>

            <div
              class="p-4 border rounded-lg"
              :class="
                selectedMatch.winner_user_id === selectedMatch.player2_user_id
                  ? 'bg-green-50 border-green-200'
                  : ''
              "
            >
              <div class="flex items-center gap-3 mb-2">
                <Avatar class="w-12 h-12">
                  <AvatarImage :src="selectedMatch.player2?.avatar_url" />
                  <AvatarFallback>{{
                    selectedMatch.player2?.nickname?.[0] || 'P2'
                  }}</AvatarFallback>
                </Avatar>
                <div>
                  <p class="font-semibold">{{ selectedMatch.player2?.nickname || 'Player 2' }}</p>
                  <p class="text-gray-600 text-sm">{{ selectedMatch.player2?.name }}</p>
                </div>
                <Trophy
                  v-if="selectedMatch.winner_user_id === selectedMatch.player2_user_id"
                  class="ml-auto w-6 h-6 text-yellow-500"
                />
              </div>
              <div class="space-y-1 text-sm">
                <p>
                  Points: <span class="font-semibold">{{ selectedMatch.player2_points }}</span>
                </p>
                <p>
                  Marks: <span class="font-semibold">{{ selectedMatch.player2_marks }}</span>
                </p>
              </div>
            </div>
          </div>
          <div v-if="selectedMatch.games && selectedMatch.games.length > 0">
            <h4 class="mb-3 font-semibold text-lg">
              Games Played ({{ selectedMatch.games.length }})
            </h4>
            <div class="space-y-2">
              <div
                v-for="(game, index) in selectedMatch.games"
                :key="game.id"
                class="flex justify-between items-center bg-white p-3 border rounded-lg"
              >
                <div class="flex items-center gap-3">
                  <span class="bg-gray-100 px-3 py-1 rounded font-semibold text-gray-700 text-sm">
                    Game {{ index + 1 }}
                  </span>
                  <span class="text-sm">
                    {{ game.player1?.nickname || 'P1' }}
                    <span class="mx-2 font-bold"
                      >{{ game.player1_points || 0 }} - {{ game.player2_points || 0 }}</span
                    >
                    {{ game.player2?.nickname || 'P2' }}
                  </span>
                </div>
                <Trophy
                  v-if="game.winner_user_id"
                  class="w-4 h-4"
                  :class="
                    game.winner_user_id === game.player1_user_id ? 'text-blue-500' : 'text-red-500'
                  "
                />
                <span v-else class="text-gray-500 text-sm italic">Draw</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useAPIStore } from '@/stores/api'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Trophy, Coins, Eye, History } from 'lucide-vue-next'

const authStore = useAuthStore()
const apiStore = useAPIStore()

const loading = ref(false)
const error = ref('')
const matches = ref([])
const pagination = ref(null)
const showDetailsDialog = ref(false)
const selectedMatch = ref(null)
const viewMode = ref('all')

const isAdmin = computed(() => authStore.isAdmin())

const getPageTitle = () => {
  if (!isAdmin.value) return 'My Match History'
  return viewMode.value === 'all' ? 'All Match History' : 'My Match History'
}

const getCardDescription = () => {
  if (!isAdmin.value) return 'Your completed matches'
  return viewMode.value === 'all'
    ? 'Complete match history for all players'
    : 'Your completed matches'
}

const getEmptyMessage = () => {
  if (!isAdmin.value) return "You haven't completed any matches yet."
  return viewMode.value === 'all'
    ? 'No completed matches in the system yet.'
    : "You haven't completed any matches yet."
}

const onViewModeChange = () => {
  loadMatchHistory()
}

const loadMatchHistory = async () => {
  loading.value = true
  error.value = ''
  try {
    const response =
      isAdmin.value && viewMode.value === 'all'
        ? await apiStore.getAllMatchHistory()
        : await apiStore.getUserMatchHistory()

    matches.value = response.data.data || []
    pagination.value = {
      current_page: response.data.current_page,
      from: response.data.from,
      to: response.data.to,
      total: response.data.total,
      prev_page_url: response.data.prev_page_url,
      next_page_url: response.data.next_page_url,
    }
  } catch (err) {
    error.value = err?.response?.data?.message || 'Failed to load match history'
  } finally {
    loading.value = false
  }
}

const viewMatchDetails = async (matchId) => {
  try {
    const response = await apiStore.getMatchDetails(matchId)
    selectedMatch.value = response.data
    showDetailsDialog.value = true
  } catch (err) {
    error.value = err?.response?.data?.error || 'Failed to load match details'
  }
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatDuration = (seconds) => {
  if (!seconds) return 'N/A'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}m ${secs}s`
}

const loadPage = (_page) => {
  loadMatchHistory()
}

onMounted(() => {
  loadMatchHistory()
})
</script>
