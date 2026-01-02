import { inject, onMounted } from 'vue'

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

  return {
    socket,
    on,
    off,
    emit,
    removeAllListeners,
  }
}
