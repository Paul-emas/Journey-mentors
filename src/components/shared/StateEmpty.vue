<script setup lang="ts">
import { SearchXIcon } from 'lucide-vue-next'

withDefaults(defineProps<{
  heading?: string
  subheading?: string
  actionLabel?: string
  onAction?: () => void
}>(), {
  heading: 'Nothing here yet',
  subheading: 'Try adjusting your search or come back later.',
})
</script>

<template>
  <div
    class="flex flex-col items-center justify-center gap-5 rounded-2xl border border-[#e8ecef] bg-white px-6 py-16 text-center shadow-[0_4px_24px_rgba(0,0,0,0.06),0_1px_4px_rgba(0,0,0,0.04)]"
  >
    <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
      <slot name="icon">
        <SearchXIcon class="h-8 w-8 text-slate-400" />
      </slot>
    </div>

    <div class="max-w-sm space-y-1.5">
      <p class="text-base font-semibold text-slate-800">{{ heading }}</p>
      <p class="text-sm text-slate-400">{{ subheading }}</p>
    </div>

    <button
      v-if="actionLabel && onAction"
      type="button"
      class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
      @click="onAction"
    >
      {{ actionLabel }}
    </button>
  </div>
</template>
