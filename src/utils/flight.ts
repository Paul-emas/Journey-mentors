import dayjs from 'dayjs'
import durationPlugin from 'dayjs/plugin/duration'
import type {
  CreateOfferRequestPassenger,
  CreateOfferRequestSlice,
  FlightCondition,
  FlightOffer,
  FlightSearchParams,
  FlightSearchPassengers,
  FlightSegment,
  Offer as DuffelOffer,
  Place,
  PlaceSuggestion,
  Segment as DuffelSegment,
} from '@/types'

dayjs.extend(durationPlugin)

export function hasIataCode(place: Place): place is Place & { iata_code: string } {
  return Boolean(place.iata_code)
}

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' })

function countryName(code: string): string | null {
  if (!code) return null
  try {
    return regionNames.of(code.toUpperCase()) ?? code
  } catch {
    return code
  }
}

export function toPlaceSuggestion(place: Place & { iata_code: string }): PlaceSuggestion {
  return {
    iataCode: place.iata_code,
    name: place.name,
    cityName: place.city_name,
    type: place.type,
    countryName: countryName(place.iata_country_code),
    label: `${place.name} (${place.iata_code})`,
  }
}

export function buildSlices(params: FlightSearchParams): CreateOfferRequestSlice[] {
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

export function buildPassengers(passengers: FlightSearchPassengers): CreateOfferRequestPassenger[] {
  const result: CreateOfferRequestPassenger[] = []

  for (let i = 0; i < passengers.adults; i++) result.push({ type: 'adult' })
  for (let i = 0; i < passengers.children; i++) result.push({ type: 'child' })
  for (let i = 0; i < passengers.infants; i++) result.push({ type: 'infant_without_seat' })

  return result
}

export function mapOffer(offer: DuffelOffer): FlightOffer {
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

function parseDuration(duration: string | null | undefined): number {
  if (!duration) return 0
  return Math.round(dayjs.duration(duration).asMinutes())
}

export function formatMinutes(total: number): string {
  if (total <= 0) return '—'
  const hours = Math.floor(total / 60)
  const minutes = total % 60
  if (!hours) return `${minutes}m`
  if (!minutes) return `${hours}h`
  return `${hours}h ${minutes}m`
}

export function formatDuration(duration: string | null | undefined): string {
  return formatMinutes(parseDuration(duration))
}

export function formatMoney(amount: string | number | null, currency: string | null): string {
  if (amount == null || !currency) return '—'
  return new Intl.NumberFormat('en', { style: 'currency', currency }).format(Number(amount))
}

export function formatCurrency(
  amount: number | string | null | undefined,
  currency: string | null | undefined,
): string {
  if (!currency) return '—'

  return new Intl.NumberFormat('en', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(Number(amount || 0))
}

export function formatTime(iso?: string): string {
  if (!iso) return '--:--'
  return dayjs(iso).format('h:mm A')
}

export function formatDateTime(iso?: string): string {
  if (!iso) return '—'
  return dayjs(iso).format('DD MMM, h:mm A')
}

export interface PlaceLike {
  name: string
  iata_code: string | null
  iata_city_code: string | null
  city_name: string | null
}

export function airportCode(place: PlaceLike): string {
  return place.iata_code || place.iata_city_code || place.name
}

export function cityName(place: PlaceLike): string {
  return place.city_name || place.name
}

export function titleCase(value: string | null | undefined): string {
  if (!value) return '—'

  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

export function describeCondition(condition: FlightCondition | null): string {
  if (!condition) return 'Not specified'
  if (!condition.allowed) return 'Not allowed'
  if (!condition.penalty_amount || !condition.penalty_currency) return 'Allowed'

  return `Allowed with ${formatCurrency(condition.penalty_amount, condition.penalty_currency)} fee`
}

export function describeStops(segment: { stops: readonly unknown[] }): string {
  if (segment.stops.length === 0) return 'Non-stop'
  return `${segment.stops.length} tech stop${segment.stops.length > 1 ? 's' : ''}`
}
