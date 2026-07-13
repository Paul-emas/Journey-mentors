<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import OfferFilters from '@/components/modules/OfferFilters.vue'
import OfferList from '@/components/modules/OfferList.vue'
import StateEmpty from '@/components/shared/StateEmpty.vue'
import StateError from '@/components/shared/StateError.vue'
import SearchForm from '@/components/modules/SearchForm.vue'
import { PlaneIcon } from 'lucide-vue-next'
import { useFlightSearch } from '@/composables/useFlightSearch'
import type { OfferSortKey, StopFilter } from '@/components/modules/OfferFilters.vue'

const { offers, data, error, isEmpty, isError, isPending, isSuccess, refetch } = useFlightSearch()

const filters = reactive({
  stops: [] as StopFilter[],
  minPrice: null as number | null,
  maxPrice: null as number | null,
  sortBy: 'price' as OfferSortKey,
})

watch(data, () => {
  filters.stops = []
  filters.minPrice = null
  filters.maxPrice = null
})

const metricsById = computed(() => new Map((data.value ?? []).map((offer) => [offer.id, offer])))

function stopBucket(stops: number): StopFilter {
  if (stops <= 0) return '0'
  if (stops === 1) return '1'
  return '2+'
}

const visibleOffers = computed(() => {
  const metrics = metricsById.value

  const filtered = (offers.value ?? []).filter((offer) => {
    const mapped = metrics.get(offer.id)
    if (!mapped) return true
    if (filters.stops.length && !filters.stops.includes(stopBucket(mapped.stops))) return false
    if (filters.minPrice != null && mapped.price < filters.minPrice) return false
    if (filters.maxPrice != null && mapped.price > filters.maxPrice) return false
    return true
  })

  return [...filtered].sort((a, b) => {
    const mappedA = metricsById.value.get(a.id)
    const mappedB = metricsById.value.get(b.id)
    if (!mappedA || !mappedB) return 0

    return filters.sortBy === 'price'
      ? mappedA.price - mappedB.price
      : mappedA.totalDurationMin - mappedB.totalDurationMin
  })
})

const priceBounds = computed(() => {
  const prices = (data.value ?? []).map((offer) => offer.price)
  if (!prices.length) return { floor: 0, ceil: 0 }
  return { floor: Math.floor(Math.min(...prices)), ceil: Math.ceil(Math.max(...prices)) }
})

const resultCurrency = computed(() => data.value?.[0]?.currency ?? null)
</script>

<template>
  <main class="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
    <SearchForm />

    <OfferList v-if="isPending" :offers="[]" :loading="true" />

    <StateError
      v-else-if="isError"
      heading="Search failed"
      :detail="error"
      action-label="Try again"
      :on-action="refetch"
    />

    <StateEmpty
      v-else-if="isSuccess && isEmpty"
      heading="No flights found"
      subheading="We couldn't find any flights matching your search. Try adjusting your dates, destination, or passenger count."
    >
      <template #icon>
        <PlaneIcon class="h-8 w-8 text-slate-400" />
      </template>
    </StateEmpty>

    <OfferList v-else-if="isSuccess && offers?.length" :offers="visibleOffers">
      <template #actions>
        <OfferFilters
          v-model:stops="filters.stops"
          v-model:min-price="filters.minPrice"
          v-model:max-price="filters.maxPrice"
          v-model:sort-by="filters.sortBy"
          :price-floor="priceBounds.floor"
          :price-ceil="priceBounds.ceil"
          :currency="resultCurrency"
        />
      </template>
    </OfferList>

    <StateEmpty
      v-else
      heading="Ready when you are"
      subheading="Search for a trip above and your flight offers will show up here."
    >
      <template #icon>
        <PlaneIcon class="h-8 w-8 text-slate-400" />
      </template>
    </StateEmpty>
  </main>
</template>
