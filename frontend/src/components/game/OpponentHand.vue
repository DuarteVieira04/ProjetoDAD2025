<template>
  <div class="relative mb-4 sm:mb-12 px-4 w-full h-20 sm:h-56">
    <div class="top-1/2 absolute inset-x-0 flex justify-center -translate-y-1/2">
      <div
        v-for="n in handCount"
        :key="n"
        class="absolute transition-all duration-500 ease-out"
        :style="cardStyle(n, handCount)"
      >
        <img
          src="/assets/cards/BACK.svg"
          alt="Card back"
          class="shadow-2xl border border-white/10 rounded-lg w-12 sm:w-28 h-20 sm:h-44"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  handCount: Number,
})

const cardStyle = (n, count) => {
  if (count === 0) return {}
  const offset = n - (count + 1) / 2
  const spacing = count >= 8 ? 10 : count >= 6 ? 14 : count >= 4 ? 20 : 30
  const rotation = count >= 8 ? 3 : count >= 6 ? 5 : count >= 4 ? 7 : 10
  const lift = Math.abs(offset) * (count >= 8 ? 4 : 8)
  return {
    transform: `translateX(${offset * spacing}px) rotate(${offset * rotation}deg) translateY(${lift}px)`,
  }
}
</script>
