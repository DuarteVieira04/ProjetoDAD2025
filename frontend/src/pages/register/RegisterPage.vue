<template>
  <div class="flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12 min-h-screen">
    <div class="w-full max-w-md">
      <div class="bg-white sm:mx-auto mt-8 px-6 py-8 rounded-2xl sm:w-full sm:max-w-md">
        <div>
          <h2 class="font-bold text-gray-900 text-3xl text-center tracking-tight">
            Create your account
          </h2>
          <p class="mt-2 text-gray-600 text-sm text-center">
            Fill in the details below to register
          </p>
        </div>

        <form class="space-y-6 mt-8" @submit.prevent="handleSubmit">
          <div class="space-y-5">
            <!-- Name -->
            <div>
              <label for="name" class="block font-medium text-gray-700 text-sm"> Full name </label>
              <div class="mt-1">
                <Input
                  id="name"
                  v-model="formData.name"
                  type="text"
                  autocomplete="name"
                  required
                  placeholder="John Doe"
                  class="w-full"
                />
              </div>
            </div>

            <!-- Nickname (optional) -->
            <div>
              <label for="nickname" class="block font-medium text-gray-700 text-sm">
                Nickname <span class="font-normal text-gray-500">(optional)</span>
              </label>
              <div class="mt-1">
                <Input
                  id="nickname"
                  v-model="formData.nickname"
                  type="text"
                  autocomplete="off"
                  placeholder="johndoe123"
                  class="w-full"
                />
              </div>
            </div>

            <!-- Email -->
            <div>
              <label for="email" class="block font-medium text-gray-700 text-sm">
                Email address
              </label>
              <div class="mt-1">
                <Input
                  id="email"
                  v-model="formData.email"
                  type="email"
                  autocomplete="email"
                  required
                  placeholder="you@example.com"
                  class="w-full"
                />
              </div>
            </div>

            <!-- Password -->
            <div>
              <label for="password" class="block font-medium text-gray-700 text-sm">
                Password
              </label>
              <div class="mt-1">
                <Input
                  id="password"
                  v-model="formData.password"
                  type="password"
                  autocomplete="new-password"
                  required
                  placeholder="••••••••"
                  class="w-full"
                />
              </div>
            </div>

            <!-- Password Confirmation -->
            <div>
              <label for="password_confirmation" class="block font-medium text-gray-700 text-sm">
                Confirm password
              </label>
              <div class="mt-1">
                <Input
                  id="password_confirmation"
                  v-model="formData.password_confirmation"
                  type="password"
                  autocomplete="new-password"
                  required
                  placeholder="••••••••"
                  class="w-full"
                />
              </div>
            </div>
          </div>

          <Button
            type="submit"
            class="justify-center py-2.5 w-full font-medium text-sm"
            :disabled="isSubmitting || !isFormValid"
          >
            {{ isSubmitting ? 'Creating account...' : 'Sign up' }}
          </Button>

          <p class="text-gray-600 text-sm text-center">
            Already have an account?
            <router-link to="/login" class="font-medium text-blue-600 hover:text-blue-500">
              Sign in
            </router-link>
          </p>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'

const authStore = useAuthStore()
const router = useRouter()

const isSubmitting = ref(false)

const formData = ref({
  name: '',
  nickname: '',
  email: '',
  password: '',
  password_confirmation: '',
})

const isFormValid = computed(() => {
  return (
    formData.value.name.trim() !== '' &&
    formData.value.email.trim() !== '' &&
    formData.value.password.trim() !== '' &&
    formData.value.password_confirmation.trim() !== '' &&
    formData.value.password === formData.value.password_confirmation
  )
})

const handleSubmit = async () => {
  if (!isFormValid.value) return

  isSubmitting.value = true

  // Only send the fields that the backend expects
  const payload = {
    name: formData.value.name.trim(),
    nickname: formData.value.nickname.trim() || null, // optional
    email: formData.value.email.trim(),
    password: formData.value.password,
    password_confirmation: formData.value.password_confirmation,
  }

  const promise = authStore.register(payload)

  toast.promise(promise, {
    loading: 'Creating your account...',
    success: (data) => {
      router.push('/')
      return `Welcome, ${data?.name || 'User'}! Account created successfully.`
    },
    error: (err) => {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to create account. Please try again.'
      return `[API] ${message}`
    },
    finally: () => {
      isSubmitting.value = false
    },
  })
}
</script>
