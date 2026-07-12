<script setup lang="ts">
import { onMounted } from 'vue';
import { useFlightSearch } from '@/composables/useFlightSearch.ts';
// import { usePlaceSuggestions } from '@/composables/usePlaceSuggestions';
import TheWelcome from '../components/TheWelcome.vue'

const { search } = useFlightSearch()

// const { query, suggestions, isLoading, clear } = usePlaceSuggestions()

onMounted(() => {
  search({
    origin: 'LHR',
    destination: 'JFK',
    departureDate: '2026-08-14',
    cabinClass: 'economy',
    passengers: {
      adults: 1,
      children: 0,
      infants: 0,
    },
  })
})
</script>

<template>
  <main>

    <TheWelcome />
  </main>
</template>
