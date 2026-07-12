import { ref, computed, readonly } from 'vue'
import type {
  CabinClass,
  CreateOfferRequestPassenger,
  CreateOfferRequestPayload,
  CreateOfferRequestSlice,
  Offer as DuffelOffer,
  OfferRequestResponse,
  Segment as DuffelSegment,
} from '@/types'

export interface FlightSearchPassengers {
  adults: number
  children: number
  infants: number
}

export interface FlightSearchParams {
  origin: string
  destination: string
  departureDate: string
  returnDate?: string | null
  cabinClass?: CabinClass
  passengers: FlightSearchPassengers
}

// UI-facing shapes mapped from the raw Duffel offer (see mapOffer/mapSegment)
export interface FlightSegment {
  origin: string
  destination: string
  departingAt: string
  arrivingAt: string
  airlineName: string
  flightNumber: string
  durationMin: number
}

export interface FlightOffer {
  id: string
  airlineName: string
  airlineCode: string | null
  price: number
  currency: string
  segments: FlightSegment[]
  stops: number
  departingAt: string
  arrivingAt: string
  totalDurationMin: number
}

type QueryStatus = 'idle' | 'pending' | 'success' | 'error'

const status = ref<QueryStatus>('idle')
const data = ref<FlightOffer[] | null>(null)
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

    // cancel any in-flight search so a slow old response can't overwrite a newer one
    controller?.abort()
    controller = new AbortController()
    const signal = controller.signal

    status.value = 'pending'
    error.value = null

    try {
      data.value = await fetchOffers(params, signal)
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
): Promise<FlightOffer[]> {
  const payload: CreateOfferRequestPayload = {
    slices: buildSlices(params),
    passengers: buildPassengers(params.passengers),
    cabin_class: params.cabinClass,
  }

  const response = await fetch('/api/duffel/offer_requests?return_offers=true', {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: payload }),
  })

  const body = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(body?.errors?.[0]?.message ?? `Flight search failed (${response.status})`)
  }

  const offers: DuffelOffer[] = (body as OfferRequestResponse)?.data?.offers ?? []
  return offers.map(mapOffer)
}

function buildSlices(params: FlightSearchParams): CreateOfferRequestSlice[] {
  const slices: CreateOfferRequestSlice[] = [
    {
      origin: params.origin,
      destination: params.destination,
      departure_date: params.departureDate,
    },
  ]

  if (params.returnDate) {
    slices.push({
      origin: params.destination,
      destination: params.origin,
      departure_date: params.returnDate,
    })
  }

  return slices
}

function buildPassengers(passengers: FlightSearchPassengers): CreateOfferRequestPassenger[] {
  const result: CreateOfferRequestPassenger[] = []

  for (let i = 0; i < passengers.adults; i++) result.push({ type: 'adult' })
  for (let i = 0; i < passengers.children; i++) result.push({ type: 'child' })
  for (let i = 0; i < passengers.infants; i++) result.push({ type: 'infant_without_seat' })

  return result
}

function mapOffer(offer: DuffelOffer): FlightOffer {
  const slice = offer.slices[0]
  const segments = slice?.segments.map(mapSegment) ?? []

  return {
    id: offer.id,
    airlineName: offer.owner.name,
    airlineCode: offer.owner.iata_code,
    price: Number(offer.total_amount),
    currency: offer.total_currency,
    segments,
    stops: segments.length - 1,
    departingAt: segments[0]?.departingAt ?? '',
    arrivingAt: segments[segments.length - 1]?.arrivingAt ?? '',
    totalDurationMin: parseDuration(slice?.duration ?? null),
  }
}

function mapSegment(segment: DuffelSegment): FlightSegment {
  return {
    origin: segment.origin.iata_code ?? segment.origin.icao_code,
    destination: segment.destination.iata_code ?? segment.destination.icao_code,
    departingAt: segment.departing_at,
    arrivingAt: segment.arriving_at,
    airlineName: segment.marketing_carrier.name,
    flightNumber:
      `${segment.marketing_carrier.iata_code ?? ''} ${segment.marketing_carrier_flight_number}`.trim(),
    durationMin: parseDuration(segment.duration),
  }
}

// Duffel returns ISO 8601 durations, e.g. "PT7H55M"
function parseDuration(duration: string | null): number {
  if (!duration) return 0
  const hours = Number(/(\d+)H/.exec(duration)?.[1] ?? 0)
  const minutes = Number(/(\d+)M/.exec(duration)?.[1] ?? 0)
  return hours * 60 + minutes
}
