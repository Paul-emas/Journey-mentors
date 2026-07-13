<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, unref, watch } from 'vue'
import dayjs from 'dayjs'
import { useVuelidate } from '@vuelidate/core'
import { helpers, required } from '@vuelidate/validators'
import { DatePicker } from '@/components/ui/date-picker'
import { PassengerSelect } from '@/components/ui/passenger-select'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import SelectSearch from '@/components/ui/select-search/index.vue'
import DaysStrip from '@/components/modules/DaysStrip.vue'
import PlaceSuggestionItem from '@/components/modules/PlaceSuggestionItem.vue'
import { useFlightSearch } from '@/composables/useFlightSearch'
import { usePlaceSuggestions } from '@/composables/usePlaceSuggestions'
import { useSearchUrlSync } from '@/composables/useSearchUrlSync'
import { useFlightAPI } from '@/network'
import { hasIataCode, toPlaceSuggestion } from '@/utils/flight'
import type { FlightSearchParams } from '@/composables/useFlightSearch'
import type { CabinClass, PlaceSuggestion } from '@/types'
import {
  PlaneTakeoffIcon,
  PlaneLandingIcon,
  LoaderIcon,
  ArrowLeftRightIcon,
  SearchIcon,
} from 'lucide-vue-next'

const { search, isPending } = useFlightSearch()

const CABIN_OPTIONS: { value: CabinClass | ''; label: string }[] = [
  { value: 'economy', label: 'Economy' },
  { value: 'premium_economy', label: 'Premium Economy' },
  { value: 'business', label: 'Business' },
  { value: 'first', label: 'First Class' },
]

const form = reactive({
  origin: '',
  destination: '',
  departureDate: '',
  returnDate: '',
  cabinClass: 'economy' as CabinClass | '',
  passengers: { adults: 1, children: 0, infants: 0 },
  isReturn: true,
})

function swapOriginDestination() {
  const o = form.origin
  form.origin = form.destination
  form.destination = o
  const op = originPlace.value
  originPlace.value = destinationPlace.value
  destinationPlace.value = op
}

const today = dayjs().format('YYYY-MM-DD')

const {
  query: originQuery,
  suggestions: originSuggestions,
  isLoading: originLoading,
} = usePlaceSuggestions()

const {
  query: destinationQuery,
  suggestions: destinationSuggestions,
  isLoading: destinationLoading,
} = usePlaceSuggestions()

const originPlace = ref<PlaceSuggestion>()
const destinationPlace = ref<PlaceSuggestion>()

watch(originPlace, (place) => {
  form.origin = place?.iataCode ?? ''
})
watch(destinationPlace, (place) => {
  form.destination = place?.iataCode ?? ''
})

const originItems = computed(() => [...originSuggestions.value])
const destinationItems = computed(() => [...destinationSuggestions.value])

function isBeforeDay(value: string, other: string): boolean {
  return dayjs(value).isBefore(dayjs(other), 'day')
}

const rules = computed(() => ({
  origin: {
    required: helpers.withMessage('Pick an origin airport', required),
  },
  destination: {
    required: helpers.withMessage('Pick a destination airport', required),
    differsFromOrigin: helpers.withMessage(
      'Must differ from origin',
      (value: string) => !value || value !== form.origin,
    ),
  },
  departureDate: {
    required: helpers.withMessage('Pick a departure date', required),
    notPast: helpers.withMessage(
      'Departure cannot be in the past',
      (value: string) => !value || !isBeforeDay(value, today),
    ),
  },
  returnDate: {
    notBeforeDeparture: helpers.withMessage(
      'Return cannot be before departure',
      (value: string) => !value || !form.departureDate || !isBeforeDay(value, form.departureDate),
    ),
  },
}))

const v$ = useVuelidate(rules, form)

const originError = computed(() => unref(v$.value.origin.$errors[0]?.$message))
const destinationError = computed(() => unref(v$.value.destination.$errors[0]?.$message))
const departureError = computed(() => unref(v$.value.departureDate.$errors[0]?.$message))
const returnError = computed(() => unref(v$.value.returnDate.$errors[0]?.$message))

watch(
  () => form.departureDate,
  (departure) => {
    if (form.returnDate && isBeforeDay(form.returnDate, departure)) form.returnDate = ''
  },
)

const lastSearch = ref<FlightSearchParams | null>(null)
const { readFromUrl } = useSearchUrlSync(lastSearch)

function buildParams(): FlightSearchParams {
  return {
    origin: form.origin,
    destination: form.destination,
    departureDate: form.departureDate,
    returnDate: form.returnDate || undefined,
    cabinClass: form.cabinClass || undefined,
    passengers: { ...form.passengers },
  }
}

function runSearch(params: FlightSearchParams) {
  lastSearch.value = params
  search(params)
}

async function onSubmit() {
  const valid = await v$.value.$validate()
  if (!valid) return

  runSearch(buildParams())
}

async function onDayStripChange() {
  await nextTick()
  if (v$.value.$invalid) return

  runSearch(buildParams())
}

function placeFromCode(iataCode: string): PlaceSuggestion {
  return {
    iataCode,
    name: iataCode,
    cityName: null,
    type: 'airport',
    countryName: null,
    label: iataCode,
  }
}

const { getPlaceSuggestions } = useFlightAPI()

async function resolvePlace(iataCode: string): Promise<PlaceSuggestion> {
  try {
    const response = await getPlaceSuggestions(iataCode)
    const match = (response._data?.data ?? [])
      .filter(hasIataCode)
      .map(toPlaceSuggestion)
      .find((place) => place.iataCode === iataCode)

    return match ?? placeFromCode(iataCode)
  } catch {
    return placeFromCode(iataCode)
  }
}

onMounted(() => {
  const params = readFromUrl()
  if (!params) return

  originPlace.value = placeFromCode(params.origin)
  destinationPlace.value = placeFromCode(params.destination)
  form.departureDate = params.departureDate
  form.returnDate = params.returnDate ?? ''
  form.isReturn = Boolean(params.returnDate)
  form.cabinClass = params.cabinClass ?? 'economy'
  form.passengers = { ...params.passengers }

  runSearch(params)

  resolvePlace(params.origin).then((place) => {
    originPlace.value = place
  })
  resolvePlace(params.destination).then((place) => {
    destinationPlace.value = place
  })
})
</script>

<template>
  <form
    novalidate
    class="flex flex-col gap-4 rounded-2xl border border-[#e8ecef] bg-white px-4 pt-5 pb-4 shadow-[0_4px_24px_rgba(0,0,0,0.06),0_1px_4px_rgba(0,0,0,0.04)] md:gap-5 md:px-7 md:pt-7 md:pb-6"
    @submit.prevent="onSubmit"
  >
    <div class="flex flex-col items-stretch gap-4 md:flex-row md:items-start">
      <div class="flex min-w-0 flex-1 flex-col items-stretch gap-3 md:flex-row md:items-start">
        <div class="relative min-w-0 flex-1">
          <SelectSearch
            id="origin"
            v-model="originPlace"
            v-model:search-term="originQuery"
            :items="originItems"
            item-label="label"
            item-key="iataCode"
            label="From"
            placeholder="City or airport"
            no-local-search
            :is-loading="originLoading"
            :has-error="v$.origin.$error"
            :error-message="originError"
          >
            <template #rightContent>
              <LoaderIcon v-if="originLoading" class="h-4 w-4 animate-spin text-gray-400" />
              <PlaneTakeoffIcon v-else class="h-4 w-4 text-gray-400" />
            </template>
            <template #item="{ record }">
              <PlaceSuggestionItem :place="record" />
            </template>
          </SelectSearch>
        </div>

        <button
          type="button"
          @click="swapOriginDestination"
          class="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center self-center rounded-xl border border-[#e8ecef] bg-white text-slate-500 transition-all duration-200 hover:border-[#1a6b5a] hover:bg-[#e6f5f1] hover:text-[#1a6b5a] active:scale-95 md:mt-[1.05rem] md:self-auto"
          aria-label="Swap origin and destination"
        >
          <ArrowLeftRightIcon class="h-4.5 w-4.5" />
        </button>

        <div class="relative min-w-0 flex-1">
          <SelectSearch
            id="destination"
            v-model="destinationPlace"
            v-model:search-term="destinationQuery"
            :items="destinationItems"
            item-label="label"
            item-key="iataCode"
            label="To"
            placeholder="City or airport"
            no-local-search
            :is-loading="destinationLoading"
            :has-error="v$.destination.$error"
            :error-message="destinationError"
          >
            <template #rightContent>
              <LoaderIcon v-if="destinationLoading" class="h-4 w-4 animate-spin text-gray-400" />
              <PlaneLandingIcon v-else class="h-4 w-4 text-gray-400" />
            </template>
            <template #item="{ record }">
              <PlaceSuggestionItem :place="record" />
            </template>
          </SelectSearch>
        </div>
      </div>

      <button
        type="submit"
        :disabled="isPending"
        class="inline-flex h-12 w-full shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#1a6b5a] px-7 text-[0.95rem] font-semibold tracking-[0.01em] whitespace-nowrap text-white transition-all duration-200 enabled:hover:-translate-y-px enabled:hover:bg-[#155a4b] enabled:hover:shadow-[0_4px_16px_rgba(26,107,90,0.3)] enabled:active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 md:mt-[1.05rem] md:w-auto"
      >
        Search
        <SearchIcon v-if="!isPending" class="h-4.5 w-4.5" :stroke-width="2.5" />
        <LoaderIcon v-else class="h-4.5 w-4.5 animate-spin" />
      </button>
    </div>

    <div class="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-center lg:flex-nowrap">
      <div class="flex min-w-0 flex-col md:w-full lg:w-auto lg:flex-[1.5]">
        <div
          class="mb-1! flex h-4.5 items-center justify-between text-[0.8rem] leading-none font-medium text-slate-500"
        >
          <span>Depart</span>
          <Switch
            id="return-toggle"
            v-model="form.isReturn"
            label="Return?"
            aria-label="Toggle return flight"
          />
        </div>
        <div class="grid gap-2" :class="form.isReturn ? 'grid-cols-2' : 'grid-cols-1'">
          <DatePicker
            id="departure-date"
            v-model="form.departureDate"
            placeholder="Select date"
            :min-date="today"
            :has-error="v$.departureDate.$error"
            :error-message="departureError"
          />
          <DatePicker
            v-if="form.isReturn"
            id="return-date"
            v-model="form.returnDate"
            placeholder="Return"
            :min-date="form.departureDate || today"
            :has-error="v$.returnDate.$error"
            :error-message="returnError"
          />
        </div>
      </div>

      <div class="flex min-w-0 flex-col md:flex-1">
        <PassengerSelect id="passengers" v-model="form.passengers" label="Passenger" />
      </div>

      <div class="flex min-w-0 flex-col md:flex-1">
        <Select
          id="cabin-class"
          v-model="form.cabinClass"
          :items="CABIN_OPTIONS"
          item-label="label"
          item-value="value"
          placeholder="All Class"
          label="Class"
        />
      </div>
    </div>

    <DaysStrip v-model="form.departureDate" class="mt-1" @update:model-value="onDayStripChange" />
  </form>
</template>
