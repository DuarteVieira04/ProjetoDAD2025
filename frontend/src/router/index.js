import AdminPage from '@/pages/admin/AdminPage.vue'
import HomePage from '@/pages/home/HomePage.vue'
import LoginPage from '@/pages/login/LoginPage.vue'
import LaravelPage from '@/pages/testing/LaravelPage.vue'
import WebsocketsPage from '@/pages/testing/WebsocketsPage.vue'
import ProfilePage from '@/pages/profile/ProfilePage.vue'
import { useAuthStore } from '@/stores/auth'
import { createRouter, createWebHistory } from 'vue-router'
import { toast } from 'vue-sonner'
import ShopPage from '@/pages/shop/ShopPage.vue'
import GameView from '@/pages/game/GameView.vue'
import LobbyPage from '@/pages/lobby/LobbyPage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: HomePage,
    },
    {
      path: '/game/:id',
      name: 'game',
      component: GameView,
      props: true,
    },
    {
      path: '/lobby',
      component: LobbyPage,
    },
    {
      path: '/login',
      component: LoginPage,
    },
    {
      path: '/admin',
      component: AdminPage,
      meta: {
        adminOnly: true,
      },
    },
    {
      path: '/profile/:userId?',
      name: 'profile',
      component: ProfilePage,
      props: true,
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/shop',
      name: 'shop',
      component: ShopPage,
    },
    {
      path: '/testing',
      children: [
        {
          path: 'laravel',
          component: LaravelPage,
        },
        {
          path: 'websockets',
          component: WebsocketsPage,
        },
      ],
    },
  ],
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    toast.error('This navigation requires authentication')
    next({ name: 'login' })
  } else if (to.meta.adminOnly && !authStore.isAdmin()) {
    toast.error('Forbidden route')
    next({ name: '' })
  } else {
    next()
  }
})

export default router
