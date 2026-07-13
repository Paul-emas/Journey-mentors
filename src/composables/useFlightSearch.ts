import { ref, computed, readonly } from 'vue'
import { FetchError } from 'ofetch'
import { useFlightAPI } from '@/network'
import { buildSlices, buildPassengers, mapOffer } from '@/utils/flight'
import type {
  CreateOfferRequestPayload,
  FlightOffer,
  FlightSearchParams,
  Offer as DuffelOffer,
} from '@/types'

export type {
  FlightSearchParams,
  FlightSearchPassengers,
  FlightOffer,
  FlightSegment,
} from '@/types'

const { createOfferRequest } = useFlightAPI()

type QueryStatus = 'idle' | 'pending' | 'success' | 'error'

const status = ref<QueryStatus>('idle')
const data = ref<FlightOffer[] | null>(null)
const offers = ref<DuffelOffer[] | null>(null)
const error = ref<string | null>(null)
const lastParams = ref<FlightSearchParams | null>(null)

let controller: AbortController | null = null

export function useFlightSearch() {
  const isPending = computed(() => status.value === 'pending')
  const isError = computed(() => status.value === 'error')
  const isSuccess = computed(() => status.value === 'success')
  const isEmpty = computed(() => status.value === 'success' && data.value?.length === 0)

  async function search(params: FlightSearchParams) {
    lastParams.value = params

    controller?.abort()
    controller = new AbortController()
    const signal = controller.signal

    status.value = 'pending'
    error.value = null

    try {
      const result = await fetchOffers(params, signal)
      offers.value = result.offers
      data.value = result.data
      status.value = 'success'
    } catch (err) {
      if (signal.aborted) return
      error.value = err instanceof Error ? err.message : 'Flight search failed'
      status.value = 'error'
    }
  }

  function refetch() {
    if (lastParams.value) search(lastParams.value)
  }

  return {
    data: readonly(data),
    offers: readonly(offers),
    error: readonly(error),
    status: readonly(status),
    isPending,
    isError,
    isSuccess,
    isEmpty,
    search,
    refetch,
  }
}

async function fetchOffers(
  params: FlightSearchParams,
  signal: AbortSignal,
): Promise<{ data: FlightOffer[]; offers: DuffelOffer[] }> {
  const payload: CreateOfferRequestPayload = {
    slices: buildSlices(params),
    passengers: buildPassengers(params.passengers),
    cabin_class: params.cabinClass,
  }

  try {
    const response = await createOfferRequest(payload, { signal })
    const offers: DuffelOffer[] = response._data?.data?.offers ?? []
    return {
      offers,
      data: offers.map(mapOffer),
    }
  } catch (err) {
    if (err instanceof FetchError) {
      throw new Error(err.data?.errors?.[0]?.message ?? `Flight search failed (${err.status})`)
    }
    throw err
  }
}
