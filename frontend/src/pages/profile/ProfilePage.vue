<template>
  <div class="mx-auto p-6 max-w-3xl">
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>
          {{
            profileStore.isViewingAnotherUserAsAdmin
              ? `User ${profileStore.displayedUser?.id}'s details`
              : 'Your account details'
          }}
        </CardDescription>
      </CardHeader>

      <CardContent v-if="profileStore.loading" class="py-12">
        <div class="flex flex-col items-center space-y-4">
          <div
            class="border-primary border-t-2 border-b-2 rounded-full w-10 h-10 animate-spin"
          ></div>
          <p class="text-muted-foreground">Loading profile...</p>
        </div>
      </CardContent>

      <CardContent v-else-if="profileStore.error" class="py-8 text-center">
        <p class="text-destructive">{{ profileStore.error }}</p>
      </CardContent>

      <CardContent v-else-if="profileStore.displayedUser" class="space-y-8">
        <div class="space-y-8">
          <div class="flex sm:flex-row flex-col items-start sm:items-center gap-6">
            <div class="group relative">
              <Avatar
                class="shadow-lg ring-4 ring-background group-hover:ring-primary/20 w-32 h-32 transition-all duration-200 cursor-pointer"
                @click="triggerFileInput"
              >
                <AvatarImage :src="profileStore.previewUrl" alt="User avatar" />
                <AvatarFallback class="text-3xl">{{ profileStore.initials }}</AvatarFallback>
              </Avatar>

              <div
                v-if="!profileStore.isViewingAnotherUserAsAdmin"
                class="absolute inset-0 flex flex-col justify-center items-center bg-black/50 opacity-0 group-hover:opacity-100 rounded-full transition-opacity duration-200"
              >
                <svg
                  class="mb-1 w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span class="font-medium text-white text-sm">Change Picture</span>
              </div>

              <div
                v-if="profileStore.displayedUser.blocked"
                class="-top-2 -right-2 absolute bg-destructive px-2 py-1 rounded-full font-medium text-destructive-foreground text-xs"
              >
                Blocked
              </div>

              <input
                type="file"
                accept="image/*"
                ref="fileInput"
                class="hidden"
                @change="onFileSelected"
              />
            </div>

            <div class="flex-1 sm:text-left text-center">
              <h2 class="font-bold text-2xl">{{ profileStore.displayedUser.name }}</h2>
              <p class="text-muted-foreground">
                <a :href="`mailto:${profileStore.displayedUser.email}`" class="hover:underline">
                  {{ profileStore.displayedUser.email }}
                </a>
              </p>
              <p class="text-muted-foreground">
                Nickname: {{ profileStore.displayedUser.nickname || '-' }}
              </p>
              <p v-if="profileStore.uploading" class="mt-2 text-primary text-sm">
                Uploading new avatar...
              </p>
            </div>
          </div>

          <div class="gap-6 grid grid-cols-1 sm:grid-cols-2">
            <div>
              <p class="font-medium text-muted-foreground text-sm">User ID</p>
              <p class="font-mono">{{ profileStore.displayedUser.id }}</p>
            </div>
            <div>
              <p class="font-medium text-muted-foreground text-sm">Role</p>
              <p>{{ profileStore.displayedUser.type === 'A' ? 'Admin' : 'Player' }}</p>
            </div>
            <div>
              <p class="font-medium text-muted-foreground text-sm">Coins Balance</p>
              <p class="font-semibold text-lg">{{ profileStore.displayedUser.coins_balance }}</p>
            </div>
            <div>
              <p class="font-medium text-muted-foreground text-sm">Account Created</p>
              <p>{{ formatDate(profileStore.displayedUser.created_at) }}</p>
            </div>
          </div>

          <!-- Actions Section -->
          <div class="space-y-6 pt-6 border-t">
            <!-- Logout Button - Only for own profile -->
            <div v-if="!profileStore.isViewingAnotherUserAsAdmin" class="w-full">
              <Button @click="logout" variant="destructive" class="w-full sm:w-auto">
                Logout
              </Button>
            </div>

            <!-- Admin Actions -->
            <div v-if="profileStore.isViewingAnotherUserAsAdmin" class="space-y-4">
              <p class="font-medium">Admin Actions</p>
              <div class="flex flex-wrap gap-3">
                <Button
                  @click="profileStore.toggleBlockUser(!profileStore.displayedUser.blocked)"
                  :variant="profileStore.displayedUser.blocked ? 'default' : 'destructive'"
                >
                  {{ profileStore.displayedUser.blocked ? 'Unblock User' : 'Block User' }}
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger as-child>
                    <Button
                      variant="destructive"
                      :disabled="profileStore.displayedUser.type === 'A'"
                    >
                      Delete User Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Permanently delete this account?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. All data for
                        <strong>{{ profileStore.displayedUser.name }}</strong>
                        (ID: {{ profileStore.displayedUser.id }}) will be permanently removed,
                        including coins, history, and profile.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        @click="handleAdminDelete"
                        class="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                        :disabled="deleting"
                      >
                        <span v-if="deleting">Deleting...</span>
                        <span v-else>Delete User</span>
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              <p
                v-if="profileStore.displayedUser.type === 'A'"
                class="mt-2 text-muted-foreground text-sm"
              >
                Admin accounts cannot be deleted by other admins.
              </p>
            </div>

            <!-- Destructive Actions - Only for own profile (below Logout) -->
            <div v-else class="space-y-4">
              <p class="font-medium text-destructive">Destructive Actions</p>
              <AlertDialog>
                <AlertDialogTrigger as-child>
                  <Button variant="destructive" class="w-full sm:w-auto"> Delete Account </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your account and
                      all associated data (coins, history, etc.).
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  <div class="space-y-4 py-4">
                    <div class="space-y-2">
                      <Label for="password">Please enter your password to confirm</Label>
                      <Input
                        id="password"
                        v-model="deletePassword"
                        type="password"
                        placeholder="Your password"
                        :disabled="deleting"
                      />
                    </div>
                    <p v-if="passwordError" class="text-destructive text-sm">
                      {{ passwordError }}
                    </p>
                  </div>

                  <AlertDialogFooter>
                    <AlertDialogCancel :disabled="deleting">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      @click="handleSelfDelete"
                      class="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                      :disabled="deleting || !deletePassword"
                    >
                      <span v-if="deleting">Deleting...</span>
                      <span v-else>Delete My Account</span>
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          <!-- Coin Transaction History (Admin Only) -->
          <div v-if="profileStore.isViewingAnotherUserAsAdmin" class="space-y-4 pt-6 border-t">
            <h3 class="font-semibold text-lg">Coin Transaction History</h3>

            <div class="space-y-3">
              <label class="block font-semibold text-sm">Filter by Type</label>
              <div class="flex flex-wrap gap-2">
                <button
                  @click="selectedType = null"
                  :class="[
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    selectedType === null
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80',
                  ]"
                >
                  All Transactions
                </button>
                <button
                  v-for="type in availableTypes"
                  :key="type"
                  @click="selectedType = type"
                  :class="[
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    selectedType === type
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80',
                  ]"
                >
                  {{ type }}
                </button>
              </div>
            </div>

            <div v-if="transactionsLoading" class="flex justify-center items-center py-8">
              <p class="text-muted-foreground">Loading transactions...</p>
            </div>

            <div
              v-else-if="!filteredTransactions || filteredTransactions.length === 0"
              class="py-8 text-center"
            >
              <p class="text-muted-foreground">No transactions found.</p>
            </div>

            <div v-else class="overflow-x-auto">
              <table class="w-full text-sm border-collapse">
                <thead>
                  <tr class="border-b">
                    <th class="px-4 py-3 font-semibold text-left">Date</th>
                    <th class="px-4 py-3 font-semibold text-left">Transaction Type</th>
                    <th class="px-4 py-3 font-semibold text-left">Coins</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="transaction in filteredTransactions"
                    :key="transaction.id"
                    class="hover:bg-muted/50 border-b transition-colors"
                  >
                    <td class="px-4 py-3">
                      {{ formatTransactionDate(transaction.transaction_datetime) }}
                    </td>
                    <td class="px-4 py-3">
                      <span
                        class="inline-flex items-center bg-primary/10 px-2.5 py-0.5 rounded-full font-medium text-primary text-xs"
                      >
                        {{ transaction.type?.name || 'Unknown' }}
                      </span>
                    </td>
                    <td class="px-4 py-3">
                      <span
                        :class="transaction.coins > 0 ? 'text-green-600' : 'text-red-600'"
                        class="font-semibold"
                      >
                        {{ transaction.coins > 0 ? '+' : '' }}{{ transaction.coins }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </CardContent>

      <CardContent v-else class="py-8 text-center">
        <p class="text-muted-foreground">You are not authorized to view this profile.</p>
      </CardContent>
    </Card>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useProfileStore } from '@/stores/profile'
import { useTransactionsStore } from '@/stores/transactions'
import { useAPIStore } from '@/stores/api'
import { useAdminStore } from '@/stores/admin'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const adminStore = useAdminStore()
const profileStore = useProfileStore()
const transactionsStore = useTransactionsStore()
const apiStore = useAPIStore()

const fileInput = ref(null)
const userTransactions = ref([])
const transactionsLoading = ref(false)
const selectedType = ref(null)

// Delete modal state
const deletePassword = ref('')
const passwordError = ref('')
const deleting = ref(false)

const logout = () => {
  authStore.logout()
  router.push('/login')
}

const handleSelfDelete = async () => {
  if (!deletePassword.value) return

  deleting.value = true
  passwordError.value = ''

  try {
    const credentials = {
      email: profileStore.displayedUser.email,
      password: deletePassword.value,
    }
    await apiStore.postLogin(credentials)

    await authStore.deleteUser()

    authStore.logout()
    router.push('/')
  } catch (_err) {
    passwordError.value = 'Incorrect password. Please try again.'
    deletePassword.value = ''
  } finally {
    deleting.value = false
  }
}

const handleAdminDelete = async () => {
  if (profileStore.displayedUser.type === 'A') return

  deleting.value = true
  try {
    await adminStore.deleteUser(profileStore.displayedUser.id)
    router.push('/admin/users')
  } catch (err) {
    console.error('Failed to delete user:', err)
  } finally {
    deleting.value = false
  }
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const formatTransactionDate = (dateString) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('pt-PT', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

const availableTypes = computed(() => {
  const types = new Set()
  userTransactions.value.forEach((t) => {
    if (t.type?.name) {
      types.add(t.type.name)
    }
  })
  return Array.from(types).sort()
})

const filteredTransactions = computed(() => {
  if (!selectedType.value) {
    return userTransactions.value
  }
  return userTransactions.value.filter((t) => t.type?.name === selectedType.value)
})

const triggerFileInput = () => {
  if (!profileStore.isViewingAnotherUserAsAdmin && fileInput.value) {
    fileInput.value.click()
  }
}

const onFileSelected = async (e) => {
  const file = e.target.files[0]
  if (file) {
    await profileStore.uploadAvatar(file)
    if (fileInput.value) fileInput.value.value = ''
  }
}

watch(
  () => route.params.userId,
  async (userId) => {
    profileStore.fetchUser(userId || null)

    if (userId && authStore.isAdmin()) {
      transactionsLoading.value = true
      selectedType.value = null
      await transactionsStore.getUserCoinsTransactions(userId)
      userTransactions.value = transactionsStore.transactions
      transactionsLoading.value = false
    }
  },
  { immediate: true },
)
</script>
