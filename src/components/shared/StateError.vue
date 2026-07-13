<script setup lang="ts">
import { RefreshCwIcon, TriangleAlertIcon } from 'lucide-vue-next'

withDefaults(defineProps<{
  heading?: string
  detail?: string | null
  actionLabel?: string
  onAction?: () => void
}>(), {
  heading: 'Something went wrong',
  detail: null,
  actionLabel: 'Try again',
})
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-5 rounded-2xl border border-red-100 bg-red-50 px-6 py-16 text-center shadow-sm">
    <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100">
      <slot name="icon">
        <TriangleAlertIcon class="h-8 w-8 text-red-400" />
      </slot>
    </div>

    <div class="max-w-sm space-y-1.5">
      <p class="text-base font-semibold text-red-800">{{ heading }}</p>
      <p class="text-sm text-red-500">
        {{ detail || 'An unexpected error occurred. Please try again.' }}
      </p>
    </div>

    <button
      v-if="onAction"
      type="button"
      class="inline-flex items-center gap-2 rounded-xl bg-red-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-600"
      @click="onAction"
    >
      <RefreshCwIcon class="h-4 w-4" />
      {{ actionLabel }}
    </button>
  </div>
</template>
