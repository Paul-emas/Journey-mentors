<script setup lang="ts">
import { computed, ref } from 'vue'
import dayjs from 'dayjs'
import {
  ChevronDownIcon,
  Clock3Icon,
  PlaneIcon,
  PlaneTakeoffIcon,
  PlaneLandingIcon,
  BaggageClaimIcon,
  CreditCardIcon,
  RefreshCwIcon,
  XCircleIcon,
  CheckCircle2Icon,
  ZapIcon,
  ShieldCheckIcon,
  MapPinIcon,
  AlarmClockIcon,
  TagIcon,
} from 'lucide-vue-next'
import type { DeepReadonly } from 'vue'
import type { CabinClass, Offer } from '@/types'
import {
  airportCode,
  cityName,
  describeCondition,
  describeStops,
  formatCurrency,
  formatDateTime,
  formatDuration,
  formatTime,
  titleCase,
} from '@/utils/flight'

type ReadonlyOffer = DeepReadonly<Offer>

const props = defineProps<{ offer: ReadonlyOffer }>()

const expanded = ref(false)
const imgError = ref(false)

const ownerLogoUrl = computed(
  () => props.offer.owner.logo_lockup_url ?? props.offer.owner.logo_symbol_url ?? '',
)

const airlineInitials = computed(() => {
  const initials = props.offer.owner.name
    .split(' ')
    .filter(Boolean)
    .map(part => part[0])
    .slice(0, 2)
    .join('')

  return initials.toUpperCase() || 'FL'
})

const firstSlice = computed(() => props.offer.slices[0] ?? null)
const firstSegment = computed(() => firstSlice.value?.segments[0] ?? null)
const lastSegment = computed(() => {
  const segments = firstSlice.value?.segments ?? []
  return segments[segments.length - 1] ?? null
})

const passengerCount = computed(() => Math.max(props.offer.passengers.length, 1))
const totalAmount = computed(() => Number(props.offer.total_amount || 0))
const compareAmount = computed(() => Number(props.offer.intended_total_amount || 0))

const totalPriceLabel = computed(() => formatCurrency(totalAmount.value, props.offer.total_currency))
const perPassengerPriceLabel = computed(() => {
  return formatCurrency(totalAmount.value / passengerCount.value, props.offer.total_currency)
})
const comparePriceLabel = computed(() => {
  if (compareAmount.value <= totalAmount.value) return ''
  return formatCurrency(compareAmount.value / passengerCount.value, props.offer.total_currency)
})

const offerCode = computed(() => {
  const carrierCode =
    props.offer.owner.iata_code ?? firstSegment.value?.marketing_carrier.iata_code ?? 'FL'

  return `#${carrierCode}-${props.offer.id.slice(-6).toUpperCase()}-${dayjs(props.offer.created_at).format('YYYY')}`
})

const CABIN_LABELS: Record<CabinClass, string> = {
  economy: 'Economy',
  premium_economy: 'Premium Economy',
  business: 'Business',
  first: 'First Class',
}

const cabinLabel = computed(() => {
  const passenger = firstSegment.value?.passengers[0]
  if (passenger?.cabin_class) return CABIN_LABELS[passenger.cabin_class]
  return passenger?.cabin?.marketing_name || passenger?.cabin_class_marketing_name || 'Economy'
})

const cabinToneClass = computed(() => {
  const label = cabinLabel.value.toLowerCase()

  if (label.includes('business')) return 'bg-[#e7f7f4] text-[#209286]'
  if (label.includes('first')) return 'bg-[#fff4dc] text-[#b7791f]'
  if (label.includes('premium')) return 'bg-[#eef4ff] text-[#4263eb]'
  return 'bg-[#fff1ef] text-[#df5b45]'
})

const departInfo = computed(() => {
  if (!firstSegment.value) return { time: '--:--', code: '---', city: '' }

  return {
    time: formatTime(firstSegment.value.departing_at),
    code: airportCode(firstSegment.value.origin),
    city: cityName(firstSegment.value.origin),
  }
})

const arriveInfo = computed(() => {
  if (!lastSegment.value) return { time: '--:--', code: '---', city: '' }

  return {
    time: formatTime(lastSegment.value.arriving_at),
    code: airportCode(lastSegment.value.destination),
    city: cityName(lastSegment.value.destination),
  }
})

const stopCount = computed(() => {
  if (!firstSlice.value) return 0

  const technicalStops = firstSlice.value.segments.reduce((count, segment) => count + segment.stops.length, 0)
  const layovers = Math.max(firstSlice.value.segments.length - 1, 0)

  return layovers + technicalStops
})

const stopLabel = computed(() => {
  if (stopCount.value === 0) return 'Direct'
  return `${stopCount.value} Stop${stopCount.value > 1 ? 's' : ''}`
})

const durationLabel = computed(() => formatDuration(firstSlice.value?.duration))

const baggageLabel = computed(() => {
  const baggages = firstSegment.value?.passengers[0]?.baggages ?? []
  if (baggages.length === 0) return 'Baggage details unavailable'

  return baggages
    .map(baggage => `${baggage.quantity} ${titleCase(baggage.type)}`)
    .join(' · ')
})

const paymentLabel = computed(() => {
  if (props.offer.payment_requirements.requires_instant_payment) return 'Instant payment required'

  if (props.offer.payment_requirements.payment_required_by) {
    return `Pay by ${formatDateTime(props.offer.payment_requirements.payment_required_by)}`
  }

  return 'No payment deadline provided'
})

const addOnLabel = computed(() => {
  const count = props.offer.available_services?.length ?? 0
  if (count === 0) return 'No extra services listed'
  return `${count} add-on${count > 1 ? 's' : ''} available`
})
</script>

<template>
  <article
    class="overflow-hidden rounded-2xl border bg-white transition-all duration-200"
    :class="expanded
      ? 'border-[#2f9f92]'
      : 'border-slate-200'"
  >
    <button
      type="button"
      class="grid w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-slate-50/70"
      style="grid-template-columns: 48px minmax(160px,1.4fr) max-content 1fr max-content minmax(150px,auto) 64px"
      @click="expanded = !expanded"
    >

      <div class="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
        <img
          v-if="ownerLogoUrl && !imgError"
          :src="ownerLogoUrl"
          :alt="offer.owner.name"
          class="h-full w-full object-contain p-1.5"
          @error="imgError = true"
        />
        <span v-else class="text-xs font-bold tracking-wider text-slate-500">{{ airlineInitials }}</span>
      </div>


      <div class="min-w-0">
        <p class="truncate text-[15px] font-semibold leading-snug text-slate-900">{{ offer.owner.name }}</p>
        <div class="mt-0.5 flex min-w-0 items-center gap-1.5">
          <span class="truncate text-xs text-slate-400">{{ offerCode }}</span>
          <span class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold leading-none" :class="cabinToneClass">
            {{ cabinLabel }}
          </span>
        </div>
      </div>


      <div class="text-center">
        <p class="text-2xl font-bold tabular-nums leading-none whitespace-nowrap text-slate-900">{{ departInfo.time }}</p>
        <p class="mt-0.5 text-xs text-slate-400">{{ departInfo.code }}</p>
      </div>


      <div class="flex flex-col gap-1.5 px-1">
        <div class="flex items-center gap-1.5">
          <span class="h-2 w-2 shrink-0 rounded-full bg-amber-400" />
          <span class="h-px flex-1 border-t border-dashed border-slate-300" />
          <PlaneIcon class="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <span class="h-px flex-1 border-t border-dashed border-slate-300" />
          <span class="h-2 w-2 shrink-0 rounded-full bg-amber-400" />
        </div>
        <div class="flex items-center justify-between text-[11px] leading-none text-slate-400">
          <span class="flex items-center gap-1">
            <Clock3Icon class="h-3 w-3" />
            {{ durationLabel }}
          </span>
          <span>{{ stopLabel }}</span>
        </div>
      </div>


      <div class="text-center">
        <p class="text-2xl font-bold tabular-nums leading-none whitespace-nowrap text-slate-900">{{ arriveInfo.time }}</p>
        <p class="mt-0.5 text-xs text-slate-400">{{ arriveInfo.code }}</p>
      </div>


      <div class="text-right">
        <div class="flex items-baseline justify-end gap-0.5">
          <span class="text-[18px] font-bold leading-none text-slate-900">{{ perPassengerPriceLabel }}</span>
          <span class="text-xs text-slate-500">/ pax</span>
        </div>
        <p v-if="comparePriceLabel" class="mt-0.5 text-xs text-slate-400 line-through">{{ comparePriceLabel }}</p>
        <p v-else class="mt-0.5 text-xs text-slate-400">{{ totalPriceLabel }} total</p>
      </div>


      <span
        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-slate-400 transition-all duration-200"
        :class="expanded ? 'rotate-180 border-[#2f9f92] text-[#2f9f92]' : 'border-slate-200'"
      >
        <ChevronDownIcon class="h-4 w-4" />
      </span>
    </button>

    <div v-if="expanded" class="border-t border-slate-100 bg-slate-50/60 px-4 py-4">
      <div class="grid gap-3 lg:grid-cols-[1.6fr_1fr_1fr]">


        <section class="rounded-xl border border-slate-200 bg-white p-4">
          <div class="flex items-center gap-2">
            <PlaneIcon class="h-4 w-4 text-[#2f9f92]" />
            <h3 class="text-sm font-semibold text-slate-900">Your Journey</h3>
            <span class="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
              {{ offer.slices.length === 1 ? 'One way' : 'Return' }}
            </span>
          </div>

          <div class="mt-3 space-y-3">
            <div v-for="(slice, index) in offer.slices" :key="slice.id" class="rounded-xl border border-slate-100 bg-slate-50 p-3">


              <div class="flex items-center gap-2">
                <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#2f9f92] text-[10px] font-bold text-white">
                  {{ index + 1 }}
                </span>
                <span class="text-xs font-semibold text-slate-700">
                  {{ index === 0 ? 'Outbound flight' : 'Return flight' }}
                </span>
                <span class="ml-auto flex items-center gap-1 text-[11px] text-slate-400">
                  <Clock3Icon class="h-3 w-3" />
                  {{ formatDuration(slice.duration) }}
                </span>
              </div>


              <div class="mt-2.5 flex items-center gap-2">
                <div class="flex items-center gap-1.5">
                  <PlaneTakeoffIcon class="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <div>
                    <p class="text-sm font-bold text-slate-900">{{ airportCode(slice.origin) }}</p>
                    <p class="text-[11px] text-slate-500">{{ cityName(slice.origin) }}</p>
                  </div>
                </div>
                <div class="h-px flex-1 border-t border-dashed border-slate-300" />
                <div class="flex items-center gap-1.5">
                  <div class="text-right">
                    <p class="text-sm font-bold text-slate-900">{{ airportCode(slice.destination) }}</p>
                    <p class="text-[11px] text-slate-500">{{ cityName(slice.destination) }}</p>
                  </div>
                  <PlaneLandingIcon class="h-3.5 w-3.5 shrink-0 text-slate-400" />
                </div>
              </div>


              <div class="mt-2.5 space-y-1.5">
                <div
                  v-for="segment in slice.segments"
                  :key="segment.id"
                  class="flex items-center justify-between rounded-lg bg-white px-3 py-2.5"
                >
                  <div class="flex items-center gap-2.5 min-w-0">
                    <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                      <PlaneIcon class="h-3.5 w-3.5 text-slate-500" />
                    </div>
                    <div class="min-w-0">
                      <p class="truncate text-sm font-medium text-slate-800">
                        {{ segment.marketing_carrier.name }}
                        <span class="font-normal text-slate-400">{{ segment.marketing_carrier_flight_number }}</span>
                      </p>
                      <p class="text-[11px] text-slate-500">
                        {{ airportCode(segment.origin) }} → {{ airportCode(segment.destination) }}
                        · {{ describeStops(segment) }}
                      </p>
                    </div>
                  </div>
                  <div class="ml-3 shrink-0 text-right">
                    <p class="text-sm font-semibold tabular-nums text-slate-800">{{ formatTime(segment.departing_at) }}</p>
                    <p class="text-[11px] text-slate-400">→ {{ formatTime(segment.arriving_at) }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>


        <section class="rounded-xl border border-slate-200 bg-white p-4">
          <div class="flex items-center gap-2">
            <ShieldCheckIcon class="h-4 w-4 text-[#2f9f92]" />
            <h3 class="text-sm font-semibold text-slate-900">Flexibility</h3>
          </div>

          <div class="mt-3 space-y-2.5">

            <div class="flex items-start gap-3 rounded-lg bg-slate-50 px-3 py-2.5">
              <component
                :is="offer.conditions.refund_before_departure?.allowed ? CheckCircle2Icon : XCircleIcon"
                class="mt-0.5 h-4 w-4 shrink-0"
                :class="offer.conditions.refund_before_departure?.allowed ? 'text-emerald-500' : 'text-red-400'"
              />
              <div>
                <p class="text-xs font-semibold text-slate-700">Cancellation</p>
                <p class="mt-0.5 text-xs text-slate-500">{{ describeCondition(offer.conditions.refund_before_departure) }}</p>
              </div>
            </div>


            <div class="flex items-start gap-3 rounded-lg bg-slate-50 px-3 py-2.5">
              <component
                :is="offer.conditions.change_before_departure?.allowed ? RefreshCwIcon : XCircleIcon"
                class="mt-0.5 h-4 w-4 shrink-0"
                :class="offer.conditions.change_before_departure?.allowed ? 'text-blue-400' : 'text-red-400'"
              />
              <div>
                <p class="text-xs font-semibold text-slate-700">Date changes</p>
                <p class="mt-0.5 text-xs text-slate-500">{{ describeCondition(offer.conditions.change_before_departure) }}</p>
              </div>
            </div>


            <div class="flex items-start gap-3 rounded-lg bg-slate-50 px-3 py-2.5">
              <component
                :is="firstSlice?.conditions.advance_seat_selection ? CheckCircle2Icon : XCircleIcon"
                class="mt-0.5 h-4 w-4 shrink-0"
                :class="firstSlice?.conditions.advance_seat_selection ? 'text-emerald-500' : 'text-slate-300'"
              />
              <div>
                <p class="text-xs font-semibold text-slate-700">Seat selection</p>
                <p class="mt-0.5 text-xs text-slate-500">
                  {{ firstSlice?.conditions.advance_seat_selection ? 'Choose your seat in advance' : 'Seats assigned at check-in' }}
                </p>
              </div>
            </div>


            <div class="flex items-start gap-3 rounded-lg bg-slate-50 px-3 py-2.5">
              <component
                :is="firstSlice?.conditions.priority_boarding ? ZapIcon : CheckCircle2Icon"
                class="mt-0.5 h-4 w-4 shrink-0"
                :class="firstSlice?.conditions.priority_boarding ? 'text-amber-400' : 'text-slate-300'"
              />
              <div>
                <p class="text-xs font-semibold text-slate-700">Boarding</p>
                <p class="mt-0.5 text-xs text-slate-500">
                  {{ firstSlice?.conditions.priority_boarding ? 'Priority boarding included' : 'Standard boarding' }}
                </p>
              </div>
            </div>
          </div>
        </section>


        <section class="rounded-xl border border-slate-200 bg-white p-4">
          <div class="flex items-center gap-2">
            <TagIcon class="h-4 w-4 text-[#2f9f92]" />
            <h3 class="text-sm font-semibold text-slate-900">Price & Extras</h3>
          </div>

          <div class="mt-3 space-y-2.5">

            <div class="flex items-start gap-3 rounded-lg bg-slate-50 px-3 py-2.5">
              <AlarmClockIcon class="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              <div>
                <p class="text-xs font-semibold text-slate-700">Payment deadline</p>
                <p class="mt-0.5 text-xs text-slate-500">{{ paymentLabel }}</p>
              </div>
            </div>


            <div class="flex items-start gap-3 rounded-lg bg-slate-50 px-3 py-2.5">
              <CreditCardIcon class="mt-0.5 h-4 w-4 shrink-0 text-[#2f9f92]" />
              <div>
                <p class="text-xs font-semibold text-slate-700">Total fare</p>
                <p class="mt-0.5 text-sm font-bold text-slate-900">{{ totalPriceLabel }}</p>
                <p class="text-[11px] text-slate-400">
                  Tax {{ offer.tax_amount ? formatCurrency(offer.tax_amount, offer.tax_currency || offer.total_currency) : 'included' }}
                </p>
              </div>
            </div>


            <div class="flex items-start gap-3 rounded-lg bg-slate-50 px-3 py-2.5">
              <BaggageClaimIcon class="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <div>
                <p class="text-xs font-semibold text-slate-700">Baggage</p>
                <p class="mt-0.5 text-xs text-slate-500">{{ baggageLabel }}</p>
              </div>
            </div>


            <div class="flex items-start gap-3 rounded-lg bg-slate-50 px-3 py-2.5">
              <MapPinIcon class="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <div>
                <p class="text-xs font-semibold text-slate-700">Add-ons</p>
                <p class="mt-0.5 text-xs text-slate-500">{{ addOnLabel }}</p>
                <p class="mt-0.5 text-[11px] text-slate-400">
                  {{ offer.passenger_identity_documents_required ? 'Passport or ID required at check-in' : 'No ID documents required' }}
                </p>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  </article>
</template>
