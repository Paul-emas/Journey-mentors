<script setup lang="ts">
withDefaults(defineProps<{
  rows?: number
}>(), {
  rows: 4,
})
</script>

<template>
  <div class="space-y-3">
    <div v-for="n in rows" :key="n">
      <slot :index="n">
        <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div class="flex items-center gap-4 px-4 py-4">
            <div class="h-12 w-12 shrink-0 animate-pulse rounded-xl bg-slate-100" />
            <div class="flex-1 space-y-2">
              <div class="h-3.5 w-36 animate-pulse rounded-full bg-slate-100" />
              <div class="h-3 w-24 animate-pulse rounded-full bg-slate-100" />
            </div>
            <div class="space-y-2 text-right">
              <div class="ml-auto h-5 w-28 animate-pulse rounded-md bg-slate-100" />
              <div class="ml-auto h-3 w-16 animate-pulse rounded-full bg-slate-100" />
            </div>
          </div>
        </div>
      </slot>
    </div>
  </div>
</template>
