<script setup lang="ts">
import { onMounted } from 'vue';
import { useFlightSearch } from '@/composables/useFlightSearch.ts';
import TheWelcome from '../components/TheWelcome.vue'

const { search } = useFlightSearch()

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
