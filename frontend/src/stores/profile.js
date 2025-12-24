import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { useAdminStore } from '@/stores/admin'
import axios from 'axios'

export const useProfileStore = defineStore('profile', () => {
  const authStore = useAuthStore()
  const adminStore = useAdminStore()

  const displayedUser = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const previewUrl = ref(null)
  const uploading = ref(false)

  const isViewingAnotherUserAsAdmin = computed(() => {
    return (
      displayedUser.value &&
      authStore.isAdmin() &&
      displayedUser.value.id !== authStore.currentUserID
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

  const fetchUser = async (userId = null) => {
    loading.value = true
    error.value = null
    try {
      if (userId && authStore.isAdmin()) {
        const response = await adminStore.getUserDetails(userId)
        displayedUser.value = response
      } else {
        displayedUser.value = authStore.currentUser
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to load user profile.'
      displayedUser.value = null
      console.error(err)
    } finally {
      loading.value = false
    }
  }

  const uploadAvatar = async (file) => {
    if (!file) return

    previewUrl.value = URL.createObjectURL(file)
    uploading.value = true
    error.value = null

    const formData = new FormData()
    formData.append('avatar', file)

    try {
      const response = await axios.post('/api/user/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      displayedUser.value.avatar_url = response.data.avatar_url
      displayedUser.value.photo_avatar_filename = response.data.photo_avatar_filename

      // Update auth store if it's the current user
      if (!isViewingAnotherUserAsAdmin.value) {
        authStore.updateCurrentUser(displayedUser.value)
      }

      previewUrl.value = null
    } catch (err) {
      error.value = 'Failed to upload avatar. Please try again.'
      previewUrl.value = null
      console.error(err)
    } finally {
      uploading.value = false
    }
  }

  const toggleBlockUser = async (shouldBlock) => {
    try {
      await adminStore.setUserBlocked(displayedUser.value.id, shouldBlock)
      displayedUser.value.blocked = shouldBlock
    } catch (err) {
      error.value = 'Failed to update user status.'
      console.error(err)
    }
  }

  const reset = () => {
    displayedUser.value = null
    previewUrl.value = null
    error.value = null
    uploading.value = false
  }

  return {
    displayedUser,
    loading,
    error,
    previewUrl,
    uploading,
    isViewingAnotherUserAsAdmin,
    initials,
    fetchUser,
    uploadAvatar,
    toggleBlockUser,
    reset,
  }
})
