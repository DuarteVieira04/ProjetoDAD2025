<template>
  <div class="mx-auto p-6 max-w-3xl">
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>
          {{
            isViewingAnotherUserAsAdmin()
              ? `User ${displayedUser.value.id}'s details`
              : 'Your account details'
          }}
        </CardDescription>
      </CardHeader>

      <CardContent v-if="displayedUser">
        <div class="space-y-6">
          <!-- Avatar + Name -->
          <div class="flex items-center space-x-4">
            <Avatar class="w-20 h-20">
              <AvatarImage
                v-if="displayedUser?.photo_avatar_filename"
                :src="`/uploads/avatars/${displayedUser.photo_avatar_filename}`"
                alt="User avatar"
              />
              <AvatarFallback>{{ initials }}</AvatarFallback>
            </Avatar>
            <div>
              <p class="font-semibold text-lg">{{ displayedUser?.name }}</p>
              <p class="text-muted-foreground text-sm">{{ displayedUser?.email }}</p>
              <p class="text-muted-foreground text-sm">Nickname: {{ displayedUser?.nickname }}</p>
            </div>
          </div>

          <!-- User details grid -->
          <div class="gap-4 grid grid-cols-2">
            <div>
              <p class="font-medium text-muted-foreground text-sm">User ID</p>
              <p>{{ displayedUser?.id }}</p>
            </div>
            <div>
              <p class="font-medium text-muted-foreground text-sm">Role</p>
              <p>{{ displayedUser?.type === 'A' ? 'Admin' : 'Player' }}</p>
            </div>
            <div>
              <p class="font-medium text-muted-foreground text-sm">Coins Balance</p>
              <p>{{ displayedUser?.coins_balance }}</p>
            </div>
            <div>
              <p class="font-medium text-muted-foreground text-sm">Account Created</p>
              <p>{{ formatDate(displayedUser?.created_at) }}</p>
            </div>
          </div>

          <div v-if="!isViewingAnotherUserAsAdmin()">
            <Button @click="logout" variant="destructive"> Logout </Button>
          </div>
        </div>
      </CardContent>

      <CardContent v-else>
        <p>You are not logged in or cannot view this profile.</p>
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
import { useRoute } from 'vue-router'
import { useAdminStore } from '@/stores/admin'

const route = useRoute()
const authStore = useAuthStore()

const adminStore = useAdminStore()

// user to display
const displayedUser = ref(null)

const isViewingAnotherUserAsAdmin = () => {
  return (
    displayedUser.value &&
    authStore.isAdmin() &&
    displayedUser.value?.id !== authStore.currentUserID
  )
}
const emits = defineEmits(['logout'])

const logout = () => {
  authStore.logout()
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  const options = { year: 'numeric', month: 'short', day: 'numeric' }
  return new Date(dateString).toLocaleDateString(undefined, options)
}

const fetchUser = async () => {
  if (route.params.userId && authStore.isAdmin()) {
    // fetch any user by ID (admin only)
    const response = await adminStore.getUserDetails(route.params.userId)
    displayedUser.value = response.data
  } else {
    // fallback to current user
    displayedUser.value = authStore.currentUser
  }
}

onMounted(fetchUser)

// initials for avatar fallback
const initials = computed(() => {
  if (!displayedUser.value?.name) return 'U'
  return displayedUser.value.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
})
</script>
