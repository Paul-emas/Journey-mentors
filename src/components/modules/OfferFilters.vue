<script lang="ts">
export type StopFilter = '0' | '1' | '2+'
export type OfferSortKey = 'price' | 'duration'
</script>

<script setup lang="ts">
import { computed, reactive, ref, type Directive } from 'vue'
import { SlidersHorizontalIcon } from 'lucide-vue-next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'

const props = defineProps<{
  priceFloor: number
  priceCeil: number
  currency: string | null
}>()

const stops = defineModel<StopFilter[]>('stops', { default: () => [] })
const minPrice = defineModel<number | null>('minPrice', { default: null })
const maxPrice = defineModel<number | null>('maxPrice', { default: null })
const sortBy = defineModel<OfferSortKey>('sortBy', { default: 'price' })

const STOP_OPTIONS: { value: StopFilter; label: string }[] = [
  { value: '0', label: 'Nonstop' },
  { value: '1', label: '1 stop' },
  { value: '2+', label: '2+ stops' },
]

const SORT_OPTIONS: { value: OfferSortKey; label: string }[] = [
  { value: 'price', label: 'Cheapest first' },
  { value: 'duration', label: 'Shortest duration' },
]

const isOpen = ref(false)
const triggerRef = ref<HTMLButtonElement>()

const draft = reactive({
  stops: [] as StopFilter[],
  minPrice: '',
  maxPrice: '',
  sortBy: 'price' as OfferSortKey,
})

const activeCount = computed(
  () =>
    (stops.value.length ? 1 : 0) + (minPrice.value != null || maxPrice.value != null ? 1 : 0),
)

function toggleDropdown() {
  isOpen.value = !isOpen.value
  if (!isOpen.value) return

  draft.stops = [...stops.value]
  draft.minPrice = minPrice.value != null ? String(minPrice.value) : ''
  draft.maxPrice = maxPrice.value != null ? String(maxPrice.value) : ''
  draft.sortBy = sortBy.value
}

function closeDropdown() {
  isOpen.value = false
}

function toggleDraftStop(value: StopFilter) {
  draft.stops = draft.stops.includes(value)
    ? draft.stops.filter((stop) => stop !== value)
    : [...draft.stops, value]
}

function toPrice(value: string): number | null {
  if (!value.trim()) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

function applyFilters() {
  stops.value = [...draft.stops]
  minPrice.value = toPrice(draft.minPrice)
  maxPrice.value = toPrice(draft.maxPrice)
  sortBy.value = draft.sortBy
  closeDropdown()
  triggerRef.value?.focus()
}

function resetFilters() {
  draft.stops = []
  draft.minPrice = ''
  draft.maxPrice = ''
  draft.sortBy = 'price'
  stops.value = []
  minPrice.value = null
  maxPrice.value = null
  sortBy.value = 'price'
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && isOpen.value) {
    event.preventDefault()
    closeDropdown()
    triggerRef.value?.focus()
  }
}

let onDocumentPointerDown: ((event: PointerEvent) => void) | null = null

const vClickOutside: Directive<HTMLElement, () => void> = {
  mounted(el, binding) {
    onDocumentPointerDown = (event) => {
      if (!el.contains(event.target as Node)) binding.value()
    }
    document.addEventListener('pointerdown', onDocumentPointerDown)
  },
  unmounted() {
    if (onDocumentPointerDown) document.removeEventListener('pointerdown', onDocumentPointerDown)
    onDocumentPointerDown = null
  },
}
</script>

<template>
  <div v-click-outside="closeDropdown" class="relative" @keydown="onKeydown">
    <button
      ref="triggerRef"
      type="button"
      class="inline-flex h-9 cursor-pointer items-center gap-2 rounded-xl border border-[#e8ecef] bg-white px-3.5 text-sm font-medium text-slate-600 transition-all duration-200 hover:border-[#1a6b5a] hover:text-[#1a6b5a]"
      :aria-expanded="isOpen"
      aria-haspopup="dialog"
      @click="toggleDropdown"
    >
      <SlidersHorizontalIcon class="h-4 w-4" />
      Filters
      <span
        v-if="activeCount"
        class="flex h-5 w-5 items-center justify-center rounded-full bg-[#1a6b5a] text-[11px] font-semibold text-white"
      >
        {{ activeCount }}
      </span>
    </button>

    <div
      v-if="isOpen"
      class="absolute right-0 z-50 mt-2 w-72 rounded-xl border border-[#e8ecef] bg-white p-4 shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
      role="dialog"
      aria-label="Offer filters"
    >
      <p class="text-xs font-semibold tracking-wide text-slate-400 uppercase">Sort by</p>
      <div class="mt-2">
        <Select
          id="offer-sort"
          v-model="draft.sortBy"
          :items="SORT_OPTIONS"
          item-label="label"
          item-value="value"
          placeholder="Sort by"
        />
      </div>

      <p class="mt-4 text-xs font-semibold tracking-wide text-slate-400 uppercase">Stops</p>
      <div class="mt-2 space-y-1">
        <label
          v-for="option in STOP_OPTIONS"
          :key="option.value"
          class="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-slate-700 transition-colors hover:bg-slate-50"
        >
          <input
            type="checkbox"
            class="h-4 w-4 cursor-pointer rounded accent-[#1a6b5a]"
            :checked="draft.stops.includes(option.value)"
            @change="toggleDraftStop(option.value)"
          />
          {{ option.label }}
        </label>
      </div>

      <div class="mt-4 flex items-center justify-between">
        <p class="text-xs font-semibold tracking-wide text-slate-400 uppercase">Price range</p>
        <span v-if="currency" class="text-[11px] font-medium text-slate-400">{{ currency }}</span>
      </div>
      <div class="mt-2 grid grid-cols-2 gap-2">
        <div>
          <Label for="filter-price-min" class="mb-1 text-xs text-slate-500">Min</Label>
          <Input
            id="filter-price-min"
            v-model="draft.minPrice"
            type="number"
            inputmode="numeric"
            min="0"
            :placeholder="String(priceFloor)"
            class="h-9 rounded-lg text-sm"
          />
        </div>
        <div>
          <Label for="filter-price-max" class="mb-1 text-xs text-slate-500">Max</Label>
          <Input
            id="filter-price-max"
            v-model="draft.maxPrice"
            type="number"
            inputmode="numeric"
            min="0"
            :placeholder="String(priceCeil)"
            class="h-9 rounded-lg text-sm"
          />
        </div>
      </div>

      <div class="mt-4 flex items-center justify-end gap-2 border-t border-[#e8ecef] pt-3">
        <button
          type="button"
          class="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
          @click="resetFilters"
        >
          Reset
        </button>
        <button
          type="button"
          class="cursor-pointer rounded-lg bg-[#1a6b5a] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#155a4b]"
          @click="applyFilters"
        >
          Apply filters
        </button>
      </div>
    </div>
  </div>
</template>
