// src/composables/useSocket.js
import { inject, onMounted, onUnmounted } from 'vue'

export function useSocket() {
  const socket = inject('socket')

  const on = (event, handler) => {
    socket.on(event, handler)
  }

  const off = (event, handler) => {
    socket.off(event, handler)
  }

  const emit = (event, data, callback) => {
    socket.emit(event, data, callback)
  }

  const removeAllListeners = () => {
    socket.removeAllListeners()
  }

  onMounted(() => {
    socket.connect()
  })

  onUnmounted(() => {
    removeAllListeners()
  })

  return {
    socket,
    on,
    off,
    emit,
    removeAllListeners,
  }
}
