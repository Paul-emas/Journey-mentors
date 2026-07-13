<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-vue-next'
import type { DeepReadonly } from 'vue'
import type { Offer } from '@/types'
import OfferItem from './OfferItem.vue'
import OfferSkeleton from './OfferSkeleton.vue'
import ListSkeleton from '@/components/shared/ListSkeleton.vue'

const props = defineProps<{
  offers: ReadonlyArray<DeepReadonly<Offer>>
  loading?: boolean
}>()

const PAGE_SIZE = 10

const page = ref(1)
const listEl = ref<HTMLElement>()

const totalPages = computed(() => Math.max(1, Math.ceil(props.offers.length / PAGE_SIZE)))
const pagedOffers = computed(() =>
  props.offers.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE),
)
const rangeStart = computed(() => (page.value - 1) * PAGE_SIZE + 1)
const rangeEnd = computed(() => Math.min(page.value * PAGE_SIZE, props.offers.length))

watch(
  () => props.offers,
  () => {
    page.value = 1
  },
)

function goTo(next: number) {
  page.value = Math.min(Math.max(next, 1), totalPages.value)
  listEl.value?.scrollTo({ top: 0 })
}
</script>

<template>
  <div
    class="rounded-2xl border border-[#e8ecef] bg-white p-4 shadow-[0_4px_24px_rgba(0,0,0,0.06),0_1px_4px_rgba(0,0,0,0.04)] md:p-5"
  >
    <div class="mb-4 flex items-center justify-between gap-3">
      <h2 class="text-xl font-semibold text-slate-900">
        <template v-if="loading">Searching flights…</template>
        <template v-else>{{ offers.length }} Search Result{{ offers.length > 1 ? 's' : '' }}</template>
      </h2>
      <div v-if="!loading">
        <slot name="actions">
          <span class="text-sm text-slate-400">Tap a fare for details</span>
        </slot>
      </div>
    </div>

    <ListSkeleton v-if="loading" :rows="4">
      <template #default>
        <OfferSkeleton />
      </template>
    </ListSkeleton>

    <div v-else ref="listEl" class="max-h-[70vh] space-y-3 overflow-y-auto">
      <OfferItem v-for="offer in pagedOffers" :key="offer.id" :offer="offer" />
    </div>

    <div
      v-if="!loading && totalPages > 1"
      class="mt-4 flex items-center justify-between border-t border-[#e8ecef] pt-4"
    >
      <span class="text-xs text-slate-400">
        Showing {{ rangeStart }}–{{ rangeEnd }} of {{ offers.length }}
      </span>
      <div class="flex items-center gap-3">
        <button
          type="button"
          :disabled="page === 1"
          class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[#e8ecef] bg-white text-slate-500 transition-all duration-200 hover:border-[#1a6b5a] hover:bg-[#e6f5f1] hover:text-[#1a6b5a] disabled:pointer-events-none disabled:opacity-40"
          aria-label="Previous page"
          @click="goTo(page - 1)"
        >
          <ChevronLeftIcon class="h-4 w-4" :stroke-width="2.5" />
        </button>
        <span class="text-sm font-medium tabular-nums text-slate-600">
          {{ page }} / {{ totalPages }}
        </span>
        <button
          type="button"
          :disabled="page === totalPages"
          class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[#e8ecef] bg-white text-slate-500 transition-all duration-200 hover:border-[#1a6b5a] hover:bg-[#e6f5f1] hover:text-[#1a6b5a] disabled:pointer-events-none disabled:opacity-40"
          aria-label="Next page"
          @click="goTo(page + 1)"
        >
          <ChevronRightIcon class="h-4 w-4" :stroke-width="2.5" />
        </button>
      </div>
    </div>
  </div>
</template>
