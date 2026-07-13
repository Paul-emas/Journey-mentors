import { watch } from 'vue'
import type { Ref } from 'vue'
import type { FlightSearchParams } from './useFlightSearch'
import type { CabinClass } from '@/types'

const CABINS: CabinClass[] = ['economy', 'premium_economy', 'business', 'first']

export function useSearchUrlSync(params: Ref<FlightSearchParams | null>) {
  const stop = watch(params, (value) => {
    if (!value) return

    const query = new URLSearchParams({
      from: value.origin,
      to: value.destination,
      depart: value.departureDate,
      adults: String(value.passengers.adults),
      children: String(value.passengers.children),
      infants: String(value.passengers.infants),
    })
    if (value.returnDate) query.set('return', value.returnDate)
    if (value.cabinClass) query.set('cabin', value.cabinClass)

    window.history.replaceState(null, '', `?${query.toString()}`)
  })

  function readFromUrl(): FlightSearchParams | null {
    const query = new URLSearchParams(window.location.search)
    const origin = query.get('from')
    const destination = query.get('to')
    const departureDate = query.get('depart')
    if (!origin || !destination || !departureDate) return null

    const cabin = query.get('cabin') as CabinClass | null
    return {
      origin,
      destination,
      departureDate,
      returnDate: query.get('return') ?? undefined,
      cabinClass: cabin && CABINS.includes(cabin) ? cabin : 'economy',
      passengers: {
        adults: toCount(query.get('adults'), 1),
        children: toCount(query.get('children'), 0),
        infants: toCount(query.get('infants'), 0),
      },
    }
  }

  return { readFromUrl, stop }
}

function toCount(value: string | null, fallback: number): number {
  if (!value) return fallback
  const n = Number(value)
  return Number.isInteger(n) && n >= 0 ? n : fallback
}
