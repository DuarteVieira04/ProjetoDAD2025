<template>
  <div class="mx-auto p-6 max-w-3xl">
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>
          {{
            isViewingAnotherUserAsAdmin
              ? `User ${displayedUser?.id}'s details`
              : 'Your account details'
          }}
        </CardDescription>
      </CardHeader>

      <!-- Loading State -->
      <CardContent v-if="loading" class="py-12">
        <div class="flex flex-col items-center space-y-4">
          <div
            class="border-primary border-t-2 border-b-2 rounded-full w-10 h-10 animate-spin"
          ></div>
          <p class="text-muted-foreground">Loading profile...</p>
        </div>
      </CardContent>

      <!-- Error State -->
      <CardContent v-else-if="error" class="py-8 text-center">
        <p class="text-destructive">{{ error }}</p>
      </CardContent>

      <!-- Profile Content -->
      <CardContent v-else-if="displayedUser" class="space-y-8">
        <div class="space-y-8">
          <!-- Avatar + Basic Info -->
          <div class="flex sm:flex-row flex-col items-start sm:items-center gap-6">
            <!-- Interactive Avatar (hover to change) -->
            <div class="group relative">
              <Avatar
                class="shadow-lg ring-4 ring-background group-hover:ring-primary/20 w-32 h-32 transition-all duration-200 cursor-pointer"
                @click="triggerFileInput"
              >
                <AvatarImage :src="previewUrl || displayedUser.avatar_url" alt="User avatar" />
                <AvatarFallback class="text-3xl">{{ initials }}</AvatarFallback>
              </Avatar>

              <!-- Hover Overlay (only for own profile) -->
              <div
                v-if="!isViewingAnotherUserAsAdmin"
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

              <!-- Blocked Badge -->
              <div
                v-if="displayedUser.blocked"
                class="-top-2 -right-2 absolute bg-destructive px-2 py-1 rounded-full font-medium text-destructive-foreground text-xs"
              >
                Blocked
              </div>

              <!-- Hidden File Input -->
              <input
                type="file"
                accept="image/*"
                ref="fileInput"
                class="hidden"
                @change="onFileSelected"
              />
            </div>

            <div class="flex-1 sm:text-left text-center">
              <h2 class="font-bold text-2xl">{{ displayedUser.name }}</h2>
              <p class="text-muted-foreground">
                <a :href="`mailto:${displayedUser.email}`" class="hover:underline">
                  {{ displayedUser.email }}
                </a>
              </p>
              <p class="text-muted-foreground">Nickname: {{ displayedUser.nickname || '-' }}</p>

              <!-- Upload Status -->
              <p v-if="uploading" class="mt-2 text-primary text-sm">Uploading new avatar...</p>
            </div>
          </div>

          <!-- User Details Grid -->
          <div class="gap-6 grid grid-cols-1 sm:grid-cols-2">
            <div>
              <p class="font-medium text-muted-foreground text-sm">User ID</p>
              <p class="font-mono">{{ displayedUser.id }}</p>
            </div>
            <div>
              <p class="font-medium text-muted-foreground text-sm">Role</p>
              <p>{{ displayedUser.type === 'A' ? 'Admin' : 'Player' }}</p>
            </div>
            <div>
              <p class="font-medium text-muted-foreground text-sm">Coins Balance</p>
              <p class="font-semibold text-lg">{{ displayedUser.coins_balance }}</p>
            </div>
            <div>
              <p class="font-medium text-muted-foreground text-sm">Account Created</p>
              <p>{{ formatDate(displayedUser.created_at) }}</p>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex sm:flex-row flex-col gap-4 pt-6 border-t">
            <div v-if="!isViewingAnotherUserAsAdmin">
              <Button @click="logout" variant="destructive" class="order-2 sm:order-1">
                Logout
              </Button>
            </div>

            <!-- Admin Actions -->
            <div v-if="isViewingAnotherUserAsAdmin" class="flex-1 order-1 sm:order-2">
              <p class="mb-3 font-medium">Admin Actions</p>
              <Button
                @click="toggleBlockUser(!displayedUser.blocked)"
                :variant="displayedUser.blocked ? 'default' : 'destructive'"
              >
                {{ displayedUser.blocked ? 'Unblock User' : 'Block User' }}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>

      <!-- Unauthorized -->
      <CardContent v-else class="py-8 text-center">
        <p class="text-muted-foreground">You are not authorized to view this profile.</p>
      </CardContent>
    </Card>
  </div>
</template>

<script setup>
import { onMounted, computed, ref } from 'vue'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth'
import { useRoute, useRouter } from 'vue-router'
import { useAdminStore } from '@/stores/admin'
import axios from 'axios'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const adminStore = useAdminStore()

const displayedUser = ref(null)
const loading = ref(true)
const error = ref(null)
const previewUrl = ref(null)
const uploading = ref(false)
const fileInput = ref(null)

const isViewingAnotherUserAsAdmin = computed(() => {
  return (
    displayedUser.value && authStore.isAdmin() && displayedUser.value.id !== authStore.currentUserID
  )
})

const initials = computed(() => {
  if (!displayedUser.value?.name) return 'U'
  return displayedUser.value.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
})

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const fetchUser = async () => {
  loading.value = true
  error.value = null
  try {
    if (route.params.userId && authStore.isAdmin()) {
      const response = await adminStore.getUserDetails(route.params.userId)
      displayedUser.value = response
    } else {
      displayedUser.value = authStore.currentUser
    }
  } catch (err) {
    error.value = 'Failed to load user profile. Please try again.'
    console.error(err)
  } finally {
    loading.value = false
  }
}

const logout = () => {
  authStore.logout()
  router.push('/login')
}

const toggleBlockUser = async (shouldBlock) => {
  try {
    await adminStore.setUserBlocked(displayedUser.value.id, shouldBlock)
    displayedUser.value.blocked = shouldBlock
  } catch (err) {
    error.value = 'Failed to update user status.'
  }
}

const triggerFileInput = () => {
  if (!isViewingAnotherUserAsAdmin.value && fileInput.value) {
    fileInput.value.click()
  }
}

const onFileSelected = async (e) => {
  const file = e.target.files[0]
  if (!file) return

  // Preview immediately
  previewUrl.value = URL.createObjectURL(file)
  uploading.value = true

  const formData = new FormData()
  formData.append('avatar', file)

  try {
    // Adjust endpoint to your actual route
    const response = await axios.post('/api/user/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })

    // Update displayed user
    displayedUser.value.avatar_url = response.data.avatar_url
    displayedUser.value.photo_avatar_filename = response.data.photo_avatar_filename

    // Update auth store if current user
    if (!isViewingAnotherUserAsAdmin.value) {
      authStore.updateCurrentUser(displayedUser.value)
    }

    // Clean up preview (now using real URL)
    previewUrl.value = null
  } catch (err) {
    error.value = 'Failed to upload avatar. Please try again.'
    previewUrl.value = null // revert preview on error
    console.error(err)
  } finally {
    uploading.value = false
    // Reset input
    if (fileInput.value) fileInput.value.value = ''
  }
}

onMounted(fetchUser)
</script>
