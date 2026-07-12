import type { $Fetch } from 'ofetch'
import type {
  CreateOfferRequestPayload,
  OfferRequestResponse,
  PlaceSuggestionsResponse,
} from '@/types'
import { FetchMethod } from '@/types/enums/fetchMethods'

export const flight = (fetcher: $Fetch) => {
  return {
    createOfferRequest(
      payload: CreateOfferRequestPayload,
      options?: { returnOffers?: boolean; signal?: AbortSignal },
    ) {
      return fetcher.raw<OfferRequestResponse>('/duffel/offer_requests', {
        method: FetchMethod.POST,
        query: { return_offers: options?.returnOffers ?? true },
        body: { data: payload },
        signal: options?.signal,
      })
    },

    getPlaceSuggestions(query: string, options?: { signal?: AbortSignal }) {
      return fetcher.raw<PlaceSuggestionsResponse>('/duffel/place_suggestions', {
        method: FetchMethod.GET,
        query: { query },
        signal: options?.signal,
      })
    },
  }
}
