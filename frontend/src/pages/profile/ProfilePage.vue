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

      <!-- Loading -->
      <CardContent v-if="profileStore.loading" class="py-12">
        <div class="flex flex-col items-center space-y-4">
          <div
            class="border-primary border-t-2 border-b-2 rounded-full w-10 h-10 animate-spin"
          ></div>
          <p class="text-muted-foreground">Loading profile...</p>
        </div>
      </CardContent>

      <!-- Error -->
      <CardContent v-else-if="profileStore.error" class="py-8 text-center">
        <p class="text-destructive">{{ profileStore.error }}</p>
      </CardContent>

      <!-- Profile Content -->
      <CardContent v-else-if="profileStore.displayedUser" class="space-y-8">
        <div class="space-y-8">
          <!-- Avatar + Basic Info -->
          <div class="flex sm:flex-row flex-col items-start sm:items-center gap-6">
            <div class="group relative">
              <Avatar
                class="shadow-lg ring-4 ring-background group-hover:ring-primary/20 w-32 h-32 transition-all duration-200 cursor-pointer"
                @click="triggerFileInput"
              >
                <!-- Correct: use preview or real URL -->
                <AvatarImage
                  :src="profileStore.previewUrl || profileStore.displayedUser.avatar_url"
                  alt="User avatar"
                />
                <AvatarFallback class="text-3xl">{{ profileStore.initials }}</AvatarFallback>
              </Avatar>

              <!-- Hover Overlay (own profile only) -->
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

              <!-- Blocked Badge -->
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

          <!-- Details Grid -->
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

          <!-- Actions -->
          <div class="flex sm:flex-row flex-col gap-4 pt-6 border-t">
            <!-- Logout only for own profile -->
            <Button
              v-if="!profileStore.isViewingAnotherUserAsAdmin"
              @click="logout"
              variant="destructive"
            >
              Logout
            </Button>

            <!-- Admin Actions -->
            <div v-if="profileStore.isViewingAnotherUserAsAdmin" class="flex-1">
              <p class="mb-3 font-medium">Admin Actions</p>
              <Button
                @click="profileStore.toggleBlockUser(!profileStore.displayedUser.blocked)"
                :variant="profileStore.displayedUser.blocked ? 'default' : 'destructive'"
              >
                {{ profileStore.displayedUser.blocked ? 'Unblock User' : 'Block User' }}
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
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useProfileStore } from '@/stores/profile'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const profileStore = useProfileStore()

const fileInput = ref(null)

const logout = () => {
  authStore.logout()
  router.push('/login')
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

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

// Fetch on mount and when route changes
watch(
  () => route.params.userId,
  (userId) => {
    profileStore.fetchUser(userId || null)
  },
  { immediate: true },
)
</script>
