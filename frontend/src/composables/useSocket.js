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

  // WARNING: removing all listeners on unmount breaks SPA navigation if the socket is shared.
  // The next component (e.g. GameView) might need listeners that were just wiped by the previous one (e.g. Lobby).
  /*
  onUnmounted(() => {
    removeAllListeners()
  })
  */

  return {
    socket,
    on,
    off,
    emit,
    removeAllListeners,
  }
}
