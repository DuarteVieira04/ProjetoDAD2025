<template>
  <div class="flex justify-center items-center px-4 sm:px-6 lg:px-8 py-12 min-h-screen">
    <div class="space-y-8 w-full max-w-md">
      <div>
        <h2 class="mt-6 font-bold text-gray-900 text-3xl text-center tracking-tight">
          Sign in to your account
        </h2>
        <p class="mt-2 text-gray-600 text-sm text-center">
          Enter your credentials to access your account
        </p>
      </div>

      <form class="space-y-6 mt-8" @submit.prevent="handleSubmit">
        <div class="space-y-4 shadow-sm rounded-md">
          <div>
            <label for="email" class="block mb-1 font-medium text-gray-700 text-sm">
              Email address
            </label>
            <Input
              id="email"
              v-model="formData.email"
              type="email"
              autocomplete="email"
              required
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label for="password" class="block mb-1 font-medium text-gray-700 text-sm">
              Password
            </label>
            <Input
              id="password"
              v-model="formData.password"
              type="password"
              autocomplete="current-password"
              required
              placeholder="••••••••"
            />
          </div>
        </div>

        <div>
          <Button type="submit" class="w-full"> Sign in </Button>
        </div>

        <div class="text-sm text-center">
          <span class="text-gray-600">Don't have an account? </span>
          <a href="#" class="font-medium text-blue-600 hover:text-blue-500"> Sign up </a>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'

const authStore = useAuthStore()
const router = useRouter()

const formData = ref({
  email: 'pa@mail.pt',
  password: '123',
})

const handleSubmit = async () => {
  const promise = authStore.login(formData.value)
  toast.promise(promise, {
    loading: 'Calling API',
    success: (data) => {
      router.push('/')
      return `Login Successful - ${data?.name}`
    },
    error: (data) =>
      `[API] Error logging in - ${data?.response?.data?.message || data?.message || 'Unknown error'}`,
  })
}
</script>
