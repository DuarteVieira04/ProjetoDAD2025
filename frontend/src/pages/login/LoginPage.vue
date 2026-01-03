<template>
  <div class="flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12 min-h-screen">
    <div class="w-full max-w-md">
      <div class="bg-white sm:mx-auto mt-8 px-6 py-8 rounded-2xl sm:w-full sm:max-w-md">
        <div>
          <h2 class="font-bold text-gray-900 text-3xl text-center tracking-tight">
            Sign in to your account
          </h2>
          <p class="mt-2 text-gray-600 text-sm text-center">
            Enter your credentials to access your account
          </p>
        </div>

        <form class="space-y-6 mt-8" @submit.prevent="handleSubmit">
          <div class="space-y-5">
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

            <div>
              <label for="password" class="block font-medium text-gray-700 text-sm">
                Password
              </label>
              <div class="mt-1">
                <Input
                  id="password"
                  v-model="formData.password"
                  type="password"
                  autocomplete="current-password"
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
            :disabled="!formData.email || !formData.password"
          >
            Sign in
          </Button>

          <p class="text-gray-600 text-sm text-center">
            Don't have an account?
            <router-link to="/register" class="font-medium text-blue-600 hover:text-blue-500">
              Sign up
            </router-link>
          </p>
        </form>
      </div>
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
  email: '',
  password: '',
  // email: 'pa@mail.pt',
  // password: '123',
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
