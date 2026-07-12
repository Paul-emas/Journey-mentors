import { ref, watch, readonly } from 'vue'
import { useDebounce } from './useDebounce'
import { useFlightAPI } from '@/network'
import { hasIataCode, toPlaceSuggestion } from '@/utils/flight'
import type { PlaceSuggestion } from '@/types'

export function usePlaceSuggestions() {
  const { getPlaceSuggestions } = useFlightAPI()

  const query = ref('')
  const suggestions = ref<PlaceSuggestion[]>([])
  const isLoading = ref(false)

  const debouncedQuery = useDebounce(query, 300)

  let controller: AbortController | null = null

  watch(debouncedQuery, (value) => {
    if (value.trim().length < 2) {
      suggestions.value = []
      return
    }
    fetchSuggestions(value)
  })

  async function fetchSuggestions(value: string) {
    controller?.abort()
    controller = new AbortController()
    const signal = controller.signal

    isLoading.value = true

    try {
      const response = await getPlaceSuggestions(value, { signal })
      suggestions.value = (response._data?.data ?? []).filter(hasIataCode).map(toPlaceSuggestion)
    } catch {
      if (signal.aborted) return
      suggestions.value = []
    } finally {
      if (!signal.aborted) isLoading.value = false
    }
  }

  function clear() {
    query.value = ''
    suggestions.value = []
  }

  return {
    query,
    suggestions: readonly(suggestions),
    isLoading: readonly(isLoading),
    clear,
  }
}
