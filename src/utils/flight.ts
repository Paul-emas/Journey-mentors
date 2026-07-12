import type {
  CreateOfferRequestPassenger,
  CreateOfferRequestSlice,
  FlightOffer,
  FlightSearchParams,
  FlightSearchPassengers,
  FlightSegment,
  Offer as DuffelOffer,
  Place,
  PlaceSuggestion,
  Segment as DuffelSegment,
} from '@/types'

export function hasIataCode(place: Place): place is Place & { iata_code: string } {
  return Boolean(place.iata_code)
}

export function toPlaceSuggestion(place: Place & { iata_code: string }): PlaceSuggestion {
  return {
    iataCode: place.iata_code,
    name: place.name,
    cityName: place.city_name,
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

// Duffel returns ISO 8601 durations, e.g. "PT7H55M"
function parseDuration(duration: string | null): number {
  if (!duration) return 0
  const hours = Number(/(\d+)H/.exec(duration)?.[1] ?? 0)
  const minutes = Number(/(\d+)M/.exec(duration)?.[1] ?? 0)
  return hours * 60 + minutes
}
