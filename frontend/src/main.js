import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { io } from 'socket.io-client'
import { useAuthStore } from '@/stores/auth'
import App from './App.vue'
import router from './router'

const apiDomain = import.meta.env.VITE_API_DOMAIN
const wsConnection = import.meta.env.VITE_WS_CONNECTION

// console.log('[main.js] api domain', apiDomain)
// console.log('[main.js] ws connection', wsConnection)

const app = createApp(App)

app.provide('serverBaseURL', `http://${apiDomain}`)
app.provide('apiBaseURL', `http://${apiDomain}/api`)

app.use(createPinia())

const socket = io(wsConnection, {
  reconnectionAttempts: 10,
  auth: (cb) => {
    const authStore = useAuthStore() // Now safe: inside Pinia app context
    const user = authStore.currentUser
    console.log({ socket: user })
    cb(user)
  },
})

app.provide('socket', socket)
app.use(router)

app.mount('#app')
