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
import CoinTransactionHistoryPage from '@/pages/shop/CoinTransactionHistoryPage.vue'
import GameView from '@/pages/game/GameView.vue'
import LobbyPage from '@/pages/lobby/LobbyPage.vue'
import ViewMatches from '@/pages/matches/ViewMatches.vue'
import MatchHistoryPage from '@/pages/matches/MatchHistoryPage.vue'
import StatisticsPage from '@/pages/statistics/StatisticsPage.vue'
import GlobalLeaderboard from '@/pages/leaderboards/GlobalLeaderboard.vue'
import PersonalLeaderboard from '@/pages/leaderboards/PersonalLeaderboard.vue'
import RegisterPage from '@/pages/register/RegisterPage.vue'

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
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/lobby/matches',
      component: ViewMatches,
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/matches/history',
      name: 'match-history',
      component: MatchHistoryPage,
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/login',
      component: LoginPage,
    },
    {
      path: '/register',
      component: RegisterPage,
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
      path: '/shop/history',
      name: 'coin-transaction-history',
      component: CoinTransactionHistoryPage,
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/statistics',
      name: 'statistics',
      component: StatisticsPage,
    },
    {
      path: '/leaderboards/global',
      name: 'global-leaderboard',
      component: GlobalLeaderboard,
    },
    {
      path: '/leaderboards/personal',
      name: 'personal-leaderboard',
      component: PersonalLeaderboard,
      meta: { requiresAuth: true },
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
    next('/login')
  } else if (to.meta.adminOnly && !authStore.isAdmin()) {
    toast.error('Forbidden route')
    next({ name: '' })
  } else {
    next()
  }
})

export default router
