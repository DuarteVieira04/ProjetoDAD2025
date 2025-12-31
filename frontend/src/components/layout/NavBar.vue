<template>
  <div>
    <NavigationMenu class="hidden md:flex w-full">
      <div class="flex justify-end items-center px-4 md:px-8 w-full h-16">
        <NavigationMenuList class="flex items-center gap-6">
          <NavigationMenuItem>
            <NavigationMenuTrigger>Testing</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul class="gap-3 grid p-4 md:w-[400px] lg:w-[500px]">
                <li>
                  <NavigationMenuLink as-child>
                    <RouterLink to="/testing/laravel">Laravel</RouterLink>
                  </NavigationMenuLink>
                </li>
                <li>
                  <NavigationMenuLink as-child>
                    <RouterLink to="/testing/websockets">Web Sockets</RouterLink>
                  </NavigationMenuLink>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>

          <NavigationMenuItem v-if="isAdmin">
            <NavigationMenuLink as-child>
              <RouterLink to="/admin">Admin</RouterLink>
            </NavigationMenuLink>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuLink>
              <span class="flex items-center cursor-default"> Coins: {{ userCoins }} </span>
            </NavigationMenuLink>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuTrigger>Leaderboards</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul class="gap-3 grid p-4 w-auto min-w-max">
                <li>
                  <NavigationMenuLink as-child>
                    <RouterLink to="/leaderboards/global">Global Leaderboard</RouterLink>
                  </NavigationMenuLink>
                </li>
                <li v-if="userLoggedIn">
                  <NavigationMenuLink as-child>
                    <RouterLink to="/leaderboards/personal">My Leaderboard</RouterLink>
                  </NavigationMenuLink>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>

          <NavigationMenuItem v-if="userLoggedIn">
            <NavigationMenuLink as-child>
              <RouterLink to="/shop">Shop</RouterLink>
            </NavigationMenuLink>
          </NavigationMenuItem>

          <NavigationMenuItem v-if="!userLoggedIn">
            <NavigationMenuLink as-child>
              <RouterLink to="/login">Login</RouterLink>
            </NavigationMenuLink>
          </NavigationMenuItem>

          <NavigationMenuItem v-else>
            <NavigationMenuLink
              as-child
              class="hover:bg-red-400 transition-colors duration-200 ease-in-out"
            >
              <a href="#" @click.prevent="handleLogout">Logout</a>
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </div>
    </NavigationMenu>

    <div class="md:hidden flex justify-end items-center px-4 h-16">
      <Button
        variant="ghost"
        size="icon"
        class="rounded-full"
        @click="open = !open"
        aria-label="Toggle menu"
      >
        <AlignJustify class="w-6 h-6" />
      </Button>

      <Teleport to="body">
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0"
          enter-to-class="opacity-100"
          leave-active-class="transition duration-200 ease-in"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <div v-if="open" class="z-40 fixed inset-0 bg-black/50" @click="open = false" />
        </Transition>

        <Transition
          enter-active-class="transition duration-300 ease-out"
          enter-from-class="translate-x-full"
          enter-to-class="translate-x-0"
          leave-active-class="transition duration-200 ease-in"
          leave-from-class="translate-x-0"
          leave-to-class="translate-x-full"
        >
          <div
            v-if="open"
            class="right-0 z-50 fixed inset-y-0 flex flex-col bg-background shadow-2xl w-80 max-w-[90vw]"
          >
            <div class="flex justify-between items-center p-4 border-border border-b">
              <h2 class="font-semibold text-lg">Menu</h2>
              <Button variant="ghost" size="icon" @click="open = false" aria-label="Close menu">
                <X class="w-5 h-5" />
              </Button>
            </div>

            <nav class="flex-1 p-6 overflow-y-auto">
              <ul class="space-y-6">
                <li>
                  <p class="mb-3 font-semibold text-foreground">Testing</p>
                  <ul class="space-y-3 pl-4">
                    <li>
                      <RouterLink
                        to="/testing/laravel"
                        class="block text-muted-foreground hover:text-foreground transition-colors"
                        @click="open = false"
                      >
                        Laravel
                      </RouterLink>
                    </li>
                    <li>
                      <RouterLink
                        to="/testing/websockets"
                        class="block text-muted-foreground hover:text-foreground transition-colors"
                        @click="open = false"
                      >
                        Web Sockets
                      </RouterLink>
                    </li>
                  </ul>
                </li>

                <li v-if="isAdmin">
                  <RouterLink
                    to="/admin"
                    class="block py-2 font-medium hover:text-foreground transition-colors"
                    @click="open = false"
                  >
                    Admin
                  </RouterLink>
                </li>

                <li v-if="!userLoggedIn">
                  <RouterLink
                    to="/login"
                    class="block py-2 font-medium hover:text-foreground transition-colors"
                    @click="open = false"
                  >
                    Login
                  </RouterLink>
                </li>
                <li v-else>
                  <button
                    @click="handleLogout"
                    class="py-2 w-full font-medium hover:text-foreground text-left transition-colors"
                  >
                    Logout
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </Transition>
      </Teleport>
    </div>
  </div>
</template>

<script setup>
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
} from '@/components/ui/navigation-menu'
import { Button } from '@/components/ui/button'
import { AlignJustify, X } from 'lucide-vue-next'
import { ref } from 'vue'

const emit = defineEmits(['logout'])

defineProps({
  userLoggedIn: Boolean,
  isAdmin: Boolean,
  userCoins: {
    type: Number,
    default: 0,
  },
})

const open = ref(false)

const handleLogout = () => {
  open.value = false
  emit('logout')
}
</script>
