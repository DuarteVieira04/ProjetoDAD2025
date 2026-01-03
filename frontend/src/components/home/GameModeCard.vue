<script setup>
defineProps({
  title: String,
  description: String,
  badge: String,
  badgeVariant: { type: String, default: 'secondary' },
  emoji: String,
  disabled: Boolean,
})
</script>

<template>
  <div class="group relative flex flex-col h-full" :aria-disabled="disabled || null">
    <div
      v-if="disabled"
      class="z-10 absolute inset-0 flex flex-col justify-center items-center bg-background/80 backdrop-blur-sm border-2 rounded-xl"
      role="alert"
      aria-label="Login required"
    >
      <slot name="locked-content" />
    </div>

    <div
      class="flex flex-col shadow-sm hover:shadow-md border-2 rounded-xl h-full overflow-hidden transition-all"
      :class="{ 'opacity-50 pointer-events-none select-none': disabled }"
    >
      <div class="px-6 pt-5 pb-2">
        <h3 class="flex items-center gap-2 font-semibold text-xl">
          {{ emoji }} {{ title }}
          <span
            v-if="badge"
            class="bg-secondary px-2 py-0.5 rounded-full text-secondary-foreground text-xs"
          >
            {{ badge }}
          </span>
        </h3>
        <p class="mt-1 text-muted-foreground text-sm">{{ description }}</p>
      </div>
      <div class="flex flex-col flex-1 justify-center px-6 pt-4 pb-6">
        <slot />
      </div>
    </div>
  </div>
</template>
