import { ofetch } from 'ofetch'
import { flight } from './flight'

const fetcher = ofetch.create({ baseURL: '/api' })

export const api = {
  flight: flight(fetcher),
}

export const useFlightAPI = () => api.flight
